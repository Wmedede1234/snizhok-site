/*
 * Спільний код сторінок «Список бажань» і «Таємний Санта».
 * Сервера немає: дані живуть у фрагменті посилання (#w=… / #s=…), який браузер нікуди не надсилає,
 * і в localStorage того, хто їх увів. Усе, що прийшло з посилання, показується лише як текст.
 */
(function () {
  'use strict';
  var T = (window.SnizhokTools = {});

  T.$ = function (s, r) { return (r || document).querySelector(s); };
  T.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* el('div', {class: 'x', text: '…', onclick: fn}, [діти]) — без innerHTML для даних користувача */
  T.el = function (tag, attrs, kids) {
    var n = document.createElement(tag), k;
    for (k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  };

  T.icon = function (id, cls) {
    var NS = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(NS, 'svg'), u = document.createElementNS(NS, 'use');
    s.setAttribute('class', 'ico' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true');
    u.setAttribute('href', '#' + id); s.appendChild(u);
    return s;
  };

  T.lsGet = function (k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  };
  T.lsSet = function (k, v) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватний режим */ }
  };

  /* ---------- Кодек посилання ----------
     Нове (#z=): поля тексту → один рядок → [cp1251, якщо всі символи вписуються] → [deflate-raw, якщо API є і так коротше] → base64url.
     Перший символ значення — версія формату: a — UTF-8, b — UTF-8+deflate, c — cp1251, d — cp1251+deflate.
     Старе (#s= / #w=): JSON → [deflate] → base64url з префіксом z/j; лишається лише для читання.
     Це стиснення, а не шифрування: будь-хто з посиланням може прочитати його вміст. */
  var SEP = '\n', MAX_CODE = 20000, MAX_BYTES = 200000;
  function b64e(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(str) {
    if (!/^[A-Za-z0-9_-]*$/.test(str) || str.length > MAX_CODE) throw new Error('bad base64url');
    var s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function pipe(bytes, stream) {
    var reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
    var chunks = [], total = 0;
    function next() {
      return reader.read().then(function (r) {
        if (r.done) {
          var out = new Uint8Array(total), pos = 0;
          for (var i = 0; i < chunks.length; i++) { out.set(chunks[i], pos); pos += chunks[i].length; }
          return out;
        }
        total += r.value.length;
        if (total > MAX_BYTES) {
          reader.cancel().catch(function () {});
          throw new Error('too big');
        }
        chunks.push(r.value);
        return next();
      });
    }
    return next();
  }
  /* Таблиця cp1251 береться з TextDecoder; байт 0x98 не використовуємо — він не визначений. */
  var cpTable;
  function cpChars() {
    if (cpTable != null) return cpTable;
    try {
      var b = new Uint8Array(128);
      for (var i = 0; i < 128; i++) b[i] = 0x80 + i;
      cpTable = new TextDecoder('windows-1251').decode(b);
      if (cpTable.length !== 128) cpTable = '';
    } catch (e) { cpTable = ''; }
    return cpTable;
  }
  function toCp(str) {
    var tbl = cpChars();
    if (!tbl) return null;
    var out = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out[i] = c;
      else {
        var k = tbl.indexOf(str.charAt(i));
        if (k < 0 || k === 0x18) return null;
        out[i] = 0x80 + k;
      }
    }
    return out;
  }
  function fromCp(bytes) {
    var tbl = cpChars(), s = '';
    for (var i = 0; i < bytes.length; i++) {
      var c = bytes[i];
      if (c === 0x98) throw new Error('bad cp1251');
      s += c < 0x80 ? String.fromCharCode(c) : tbl.charAt(c - 0x80);
    }
    return s;
  }
  function smallest(list) { return list.reduce(function (a, b) { return b.length < a.length ? b : a; }); }

  /* T.pack(['2', 'Оля', …]) → Promise<'d…'>. Поля — однорядкові; кінцеві порожні відкидаються. */
  T.pack = function (fields) {
    var f = fields.map(function (v) { return String(v == null ? '' : v).replace(/\s+/g, ' '); });
    while (f.length && !f[f.length - 1]) f.pop();
    var text = f.join(SEP), utf = new TextEncoder().encode(text), cp = toCp(text);
    var plain = [{ m: 'a', b: utf }];
    if (cp) plain.push({ m: 'c', b: cp });
    var best = smallest(plain.map(function (x) { return x.m + b64e(x.b); }));
    if (typeof CompressionStream === 'undefined') return Promise.resolve(best);
    return Promise.all([
      pipe(utf, new CompressionStream('deflate-raw')).then(function (z) { return 'b' + b64e(z); }),
      cp ? pipe(cp, new CompressionStream('deflate-raw')).then(function (z) { return 'd' + b64e(z); }) : '',
    ]).then(function (r) { return smallest([best, r[0], r[1] || best]); }, function () { return best; });
  };
  /* T.unpack(code) → Promise<string[]>; будь-яка вада → відхилений проміс. */
  T.unpack = function (code) {
    return Promise.resolve().then(function () {
      var m = code.charAt(0), bytes = b64d(code.slice(1)), zipped = m === 'b' || m === 'd';
      if (!/^[a-d]$/.test(m) || !bytes.length) throw new Error('unknown format');
      return zipped ? pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    }).then(function (bytes) {
      var m = code.charAt(0), text = (m === 'c' || m === 'd') ? fromCp(bytes) : new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return text.split(SEP);
    });
  };
  /* Старий формат (JSON-обʼєкт): лише розбір посилань, створених раніше. */
  T.decode = function (str) {
    return Promise.resolve().then(function () {
      var kind = str.charAt(0), bytes = b64d(str.slice(1));
      if (kind === 'j') return bytes;
      if (kind === 'z') return pipe(bytes, new DecompressionStream('deflate-raw'));
      throw new Error('unknown format');
    }).then(function (bytes) {
      var obj = JSON.parse(new TextDecoder().decode(bytes));
      if (!obj || typeof obj !== 'object') throw new Error('bad payload');
      return obj;
    });
  };

  /* Значення з фрагмента: #w=… → hashParam('w') */
  T.hashParam = function (name) {
    var m = new RegExp('(?:^#|&)' + name + '=([^&]*)').exec(location.hash);
    return m ? m[1] : '';
  };
  /* Перший параметр фрагмента: #z=abc → {key:'z', value:'abc'}; без параметра — null (звичайне відкриття сторінки). */
  T.hashParamAny = function () {
    var m = /^#([A-Za-z]+)=([^&]*)/.exec(location.hash);
    return m ? { key: m[1], value: m[2] } : null;
  };
  /* Адреса для «Поділитися»: завжди публічна (SITE_URL), якщо сторінку відкрито локально.
     Інакше людина надсилає друзям localhost, який у них не відкривається. */
  T.pageUrl = function (file) {
    var site = (window.SNIZHOK_CONFIG && window.SNIZHOK_CONFIG.SITE_URL) || '';
    var local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
    if (site && local) return site.replace(/\/?$/, '/') + (file || '');
    return location.origin + location.pathname.replace(/[^/]*$/, '') + (file || '');
  };

  /* Лише http(s). «example.com/x» доповнюємо до https://. Усе інше (javascript:, data:) відкидаємо. */
  T.safeUrl = function (raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
      if (!/^[^\s/]+\.[^\s/]{2,}(\/|$|\?|#)/.test(s)) return '';
      s = 'https://' + s;
    }
    try {
      var u = new URL(s);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '';
    } catch (e) { return ''; }
  };
  T.host = function (url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  T.str = function (v, max) { return typeof v === 'string' ? v.slice(0, max || 200) : ''; };

  /* ---------- Буфер обміну, месенджери, системне «Поділитися» ---------- */
  T.copy = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  };
  function legacyCopy(text) {
    var ta = T.el('textarea', { readonly: true, 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;left:-9999px;top:0;opacity:0' });
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (e) { /* старі браузери */ }
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  /* Кнопка на ~2 с міняє підпис («Скопійовано») і повертає його назад. */
  T.flash = function (btn, label) {
    var tn = btn.lastChild;
    if (!tn || tn.nodeType !== 3) return;
    if (btn._orig == null) btn._orig = tn.data;
    tn.data = label; btn.classList.add('is-done');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { tn.data = btn._orig; btn._orig = null; btn.classList.remove('is-done'); }, 2000);
  };
  /* Копіює text; успіх → «Скопійовано» на кнопці + toast; невдача → виділяє поле (якщо є) і підказує, що робити. */
  T.copyWith = function (btn, text, okMsg, failMsg, field) {
    return T.copy(text).then(function (ok) {
      if (ok) { T.flash(btn, 'Скопійовано'); T.toast(okMsg); }
      else { if (field) { field.focus(); field.select(); } T.toast(failMsg); }
      return ok;
    });
  };
  T.tgUrl = function (url, text) {
    return 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text || '');
  };
  T.viberUrl = function (url, text) {
    return 'viber://forward?text=' + encodeURIComponent((text ? text + ' ' : '') + url);
  };
  T.canShare = function () { return typeof navigator.share === 'function'; };
  T.share = function (title, text, url) {
    return navigator.share({ title: title, text: text, url: url }).then(function () { return true; }, function () { return false; });
  };

  /* ---------- Повідомлення внизу екрана (з необов'язковою дією «Повернути») ---------- */
  var toastTimer;
  T.toast = function (text, actionLabel, onAction) {
    var box = T.$('#toast');
    if (!box) return;
    box.textContent = '';
    box.appendChild(T.el('span', { text: text }));
    if (actionLabel) {
      box.appendChild(T.el('button', {
        type: 'button', class: 't-toast__btn', text: actionLabel,
        onclick: function () { box.classList.remove('is-on'); onAction(); },
      }));
    }
    box.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('is-on'); }, actionLabel ? 6000 : 3500);
  };

  /* ---------- Іконки (Lucide, ISC) — статичний спрайт ---------- */
  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<symbol id="i-snow" viewBox="0 0 24 24"><path d="M2 12h20M12 2v20m8-6-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></symbol>' +
    '<symbol id="i-up" viewBox="0 0 24 24"><path d="m5 12 7-7 7 7M12 19V5"/></symbol>' +
    '<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 5v14m7-7-7 7-7-7"/></symbol>' +
    '<symbol id="i-right" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></symbol>' +
    '<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></symbol>' +
    '<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></symbol>' +
    '<symbol id="i-send" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4ZM22 2 11 13"/></symbol>' +
    '<symbol id="i-share" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></symbol>' +
    '<symbol id="i-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></symbol>' +
    '<symbol id="i-ext" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></symbol>' +
    '</defs></svg>';
  document.addEventListener('DOMContentLoaded', function () {
    var holder = document.createElement('div');
    holder.innerHTML = SPRITE; // статична розмітка, не дані користувача
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
    snow();
  });

  /* ---------- Легкий сніг на тлі (той самий шар #flakes, що й на головній) ---------- */
  function snow() {
    var c = T.$('#flakes');
    if (!c || !c.getContext) return;
    var ctx = c.getContext('2d'), W = 0, H = 0, flakes = [], raf = 0, last = 0;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, W / 18));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 1.8, v: 12 + Math.random() * 26, a: 0.2 + Math.random() * 0.45, p: Math.random() * 6.28 });
      draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.v * dt; f.p += dt; f.x += Math.sin(f.p) * 8 * dt;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        ctx.globalAlpha = f.a; ctx.fillStyle = '#EAF1FF';
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
      }
    }
    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (t - last < 33) return;
      var dt = last ? Math.min(0.06, (t - last) / 1000) : 0; last = t;
      draw(dt);
    }
    size();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    if (reduce) return;
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
    });
  }
})();
