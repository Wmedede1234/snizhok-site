/* Сніжок — логіка лендингу v3. Без фреймворків і зовнішніх скриптів. */
(function () {
  'use strict';

  var CFG = window.SNIZHOK_CONFIG || {};
  var ENGINE_BASE = CFG.ENGINE_BASE || './engine/';
  var LS_USER = 'snizhok.userName';
  var LS_CALL = 'snizhok.callName';
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* приватний режим */ } }

  /* ---------- Дні до Нового року, годинник ---------- */
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  (function () {
    var now = new Date();
    var d = Math.ceil((new Date(now.getFullYear() + 1, 0, 1) - now) / 86400000);
    $('#days').textContent = d;
    $('#days-word').textContent = plural(d, 'день', 'дні', 'днів') + ' до свята';
    var clock = $('#clock');
    var tick = function () { var t = new Date(); clock.textContent = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); };
    tick(); setInterval(tick, 30000);
  })();

  var toastTimer;
  function toast(text) {
    var el = $('#toast');
    el.textContent = text; el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3500);
  }

  /* ---------- Завантаження: визначення ОС ---------- */
  function detectOS() {
    var uad = navigator.userAgentData;
    var p = ((uad && uad.platform) || navigator.platform || '').toLowerCase();
    var ua = (navigator.userAgent || '').toLowerCase();
    if ((uad && uad.mobile) || /android|iphone|ipad|ipod|mobile/.test(ua) || (p === 'macintel' && navigator.maxTouchPoints > 1)) return 'mobile';
    if (p.indexOf('win') === 0 || /windows/.test(ua)) return 'win';
    if (p.indexOf('mac') === 0 || /mac os x|macintosh/.test(ua)) return 'mac';
    return 'other';
  }
  var OS = detectOS();
  document.documentElement.setAttribute('data-os', OS);
  (function () {
    var url = { win: CFG.DOWNLOAD_WIN, mac: CFG.DOWNLOAD_MAC };
    var all = $('#dl-all'); if (all) all.href = CFG.RELEASES_PAGE;
    $$('[data-dl-group]').forEach(function (g) {
      var win = $('[data-os="win"]', g), mac = $('[data-os="mac"]', g);
      win.href = url.win; mac.href = url.mac;
      var style = function (el, primary) { el.classList.toggle('btn--cta', primary); el.classList.toggle('btn--ghost', !primary); };
      var label = function (el, t) { $('[data-label]', el).textContent = t; };
      if (OS === 'mac') { style(mac, true); style(win, false); g.insertBefore(mac, win); label(win, 'Для Windows'); }
      else if (OS === 'win') { style(win, true); style(mac, false); label(mac, 'Для macOS'); }
      else { style(win, false); style(mac, false); }
    });
    if (OS === 'mobile' || OS === 'other') {
      var msg = OS === 'mobile'
        ? 'Сніжок — застосунок для компʼютерів з Windows і macOS. Відкрий цю сторінку на компʼютері.'
        : 'Сніжок працює на компʼютерах з Windows і macOS. Версії для Linux поки немає.';
      var hint = $('[data-dl-hint]'); if (hint) hint.textContent = msg;
      var note = $('#dl-note'); if (note) note.textContent = msg;
    }
  })();

  /* ---------- Вікна сцени: перетягування + «Струсити вікна» ---------- */
  var stage = $('#stage');
  var canvas = $('#snow');
  var wins = $$('.fwin');
  var zTop = 10;
  wins.forEach(function (w) {
    var h = $('[data-drag]', w), sx, sy, ox, oy, drag = false;
    h.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = true; w.style.zIndex = ++zTop; sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop;
      h.setPointerCapture(e.pointerId); e.preventDefault();
    });
    h.addEventListener('pointermove', function (e) {
      if (!drag) return;
      w.style.left = Math.max(0, Math.min(stage.clientWidth - w.offsetWidth, ox + e.clientX - sx)) + 'px';
      w.style.top = Math.max(30, Math.min(stage.clientHeight - w.offsetHeight, oy + e.clientY - sy)) + 'px';
    });
    var end = function () { drag = false; };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  });
  function shake() {
    var t0 = performance.now();
    (function f(t) {
      var k = (t - t0) / 420, dx = k < 1 ? Math.sin(k * Math.PI * 6) * 18 * (1 - k) : 0;
      wins.forEach(function (w) { w.style.transform = dx ? 'translateX(' + dx.toFixed(1) + 'px)' : ''; });
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  function getWindows() {
    var c = canvas.getBoundingClientRect();
    return wins.map(function (w) {
      var r = w.getBoundingClientRect();
      return { id: w.getAttribute('data-win'), x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height, z: +getComputedStyle(w).zIndex || 0 };
    }).sort(function (a, b) { return b.z - a.z; }).map(function (r) { return { id: r.id, x: r.x, y: r.y, w: r.w, h: r.h }; });
  }

  /* ---------- Голос: лише uk-UA ---------- */
  var ukVoice = null, userGreeted = false, voiceNoteShown = false;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    var best = null, score = -1;
    speechSynthesis.getVoices().forEach(function (v) {
      if (!v.lang || !/^uk/i.test(v.lang)) return;
      var s = (v.localService ? 4 : 0) + (/uk[-_]UA/i.test(v.lang) ? 2 : 0) + (/natural|neural|premium|enhanced/i.test(v.name) ? 1 : 0);
      if (s > score) { best = v; score = s; }
    });
    return best;
  }
  if ('speechSynthesis' in window) {
    ukVoice = pickVoice();
    try { speechSynthesis.addEventListener('voiceschanged', function () { ukVoice = pickVoice(); }); } catch (e) { /* старі браузери */ }
  }
  function speakUk(text) {
    if (!ukVoice) ukVoice = pickVoice();
    var engineSaysNo = window.Snezhok && typeof window.Snezhok.hasVoice === 'function' && !window.Snezhok.hasVoice();
    if (!ukVoice || engineSaysNo) {
      if (userGreeted && !voiceNoteShown) { voiceNoteShown = true; $('#voice-note').hidden = false; }
      return;
    }
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.voice = ukVoice; u.lang = ukVoice.lang; u.pitch = 1.1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* тиха деградація */ }
  }

  /* ---------- Рушій: лінивий старт, пауза поза екраном ---------- */
  var engine = null, pending = [], loading = false;
  var visible = false, userStarted = !reduceMotion, globeWins = false;
  function withEngine(fn) { if (engine) { try { fn(engine); } catch (e) { console.warn('[Сніжок]', e); } } else { pending.push(fn); loadEngine(); } }
  function sync() { if (engine) { (userStarted && visible && !globeWins && !document.hidden) ? engine.resume() : engine.pause(); } }

  var PHRASES = [
    "{ім'я}, що будемо робити?", "{ім'я}, мандаринку хочеш?", 'До Нового року лишилось {дні}!',
    "Сніговик сумує без тебе, {ім'я}!", "{ім'я}, може, какао з зефірками?", "Ау, {ім'я}! Ялинка питає, де ти.",
  ];
  var SETTINGS = reduceMotion
    ? { calm: true, intensity: 0, wind: 0, sounds: false, snowmobiles: false, sleigh: false }
    : { intensity: 0, wind: 1, sounds: false, garland: true, sleigh: true, surprises: true, snowmobiles: false };

  function startEngine() {
    if (engine || !window.Snezhok || typeof window.Snezhok.createEngine !== 'function') return;
    var user = lsGet(LS_USER), call = lsGet(LS_CALL);
    try {
      engine = window.Snezhok.createEngine({
        canvas: canvas, assetsBase: ENGINE_BASE + 'assets/', imageFormat: 'webp', mode: 'demo', settings: SETTINGS,
        userName: user, callName: call || user, phrases: PHRASES,
        topInset: 30, bottomInset: 0, getWindows: getWindows, speak: speakUk,
        onInteractiveHover: function (over) { canvas.style.pointerEvents = over ? 'auto' : 'none'; canvas.style.cursor = over ? 'pointer' : ''; },
        onEvent: function (name) {
          if (name === 'tangerineEaten') toast('Смачного! Мандаринку зʼїдено.');
          else if (name === 'squirrelFed') toast('Білочка взяла горішок.');
        },
      });
    } catch (e) { console.warn('[Сніжок] рушій не запустився:', e); engine = null; return; }
    window.__snizhokEngine = engine;
    var q = pending; pending = []; q.forEach(withEngine);
    sync();
    if (reduceMotion) {
      // статичний кадр + кнопка запуску
      engine.resume(); setTimeout(function () { sync(); $('#demo-play').hidden = false; }, 700);
    } else {
      // єдиний оркестрований момент: сніговик виринає і звертається до гостя
      setTimeout(function () {
        if (userGreeted) return;
        var u = currentUser();
        engine.greet(u.userName ? u.callName + ', з поверненням!' : 'Привіт! Як тебе звати?');
      }, 900);
    }
  }
  function loadEngine() {
    if (loading || engine) return;
    loading = true;
    if (window.Snezhok) { startEngine(); return; }
    var s = document.createElement('script');
    s.src = ENGINE_BASE + 'snezhok-engine.js'; s.async = true;
    s.onload = startEngine;
    s.onerror = function () { console.info('[Сніжок] рушій недоступний — сторінка працює без живої сцени'); };
    document.head.appendChild(s);
  }
  // лінивий старт: коли сцена видима і браузер вільний після завантаження
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 300); };
  // на вузьких екранах рушій (≈140 КБ JS) вантажимо, лише коли сцена видима більш ніж на 60 %
  var thr = innerWidth < 700 ? 0.6 : 0.2, ratio = 0;

  /* ---------- Сніжна куля: вантажимо за ~300 px до секції; важка сцена одночасно лише одна ---------- */
  var stageArea = 0, globeCtl = null, globeEl = $('#globe');
  function arbitrate() {
    var gArea = globeCtl ? globeCtl.area : 0;
    globeWins = gArea > 0 && gArea > stageArea;
    if (globeCtl) globeCtl.setHold(!globeWins && stageArea > 0);
    sync();
  }
  function globeStatic() {
    if (!globeEl) return;
    globeEl.classList.add('is-static');
    globeEl.setAttribute('role', 'img');
    globeEl.removeAttribute('tabindex');
    globeEl.setAttribute('aria-label', 'Сніжна куля з робочим столом (нерухома картинка)');
    globeEl.removeAttribute('aria-describedby');
    var hint = $('#globe-hint'); if (hint) hint.hidden = true;
    globeCtl = null; arbitrate();
  }
  function startGlobe() {
    if (!window.SnizhokGlobe) return globeStatic();
    globeCtl = window.SnizhokGlobe.init(globeEl, { onView: arbitrate, onFail: globeStatic });
    if (!globeCtl) globeStatic(); else arbitrate();
  }
  function loadGlobe() {
    if (window.SnizhokGlobe) { startGlobe(); return; }
    var gs = document.createElement('script');
    gs.src = 'globe.js'; gs.async = true; gs.onload = startGlobe; gs.onerror = globeStatic;
    document.head.appendChild(gs);
  }
  if (globeEl) {
    if (reduceMotion) globeStatic();
    else if ('IntersectionObserver' in window) {
      var gLoad = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { gLoad.disconnect(); loadGlobe(); }
      }, { rootMargin: '300px 0px' });
      gLoad.observe(globeEl);
    } else { window.addEventListener('load', loadGlobe); }
  }
  function kick() { if (visible && ratio >= thr) idle(loadEngine, { timeout: 1500 }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; ratio = es[0].intersectionRatio; stageArea = visible ? es[0].intersectionRect.width * es[0].intersectionRect.height : 0; if (!engine) kick(); arbitrate(); }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }).observe(stage);
  } else { visible = true; ratio = 1; }
  // на компʼютерах сцена під полем імені: рушій готуємо заздалегідь, але він на паузі, доки сцену не видно
  function warm() { kick(); if (innerWidth >= 700) idle(loadEngine, { timeout: 2500 }); }
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm);
  document.addEventListener('visibilitychange', sync);
  $('#demo-play').addEventListener('click', function () { userStarted = true; this.hidden = true; sync(); });

  /* ---------- Ім'я ---------- */
  var nameInput = $('#user-name'), callInput = $('#call-name'), help = $('#name-help');
  var callToggle = $('#call-toggle'), callWrap = $('#call-wrap');
  var lastGreeted = '';
  function clean(v) { return String(v || '').replace(/[\u0000-\u001f<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24); }
  function currentUser() { var u = clean(nameInput.value); return { userName: u, callName: clean(callInput.value) || u }; }
  function greetUser(force) {
    var u = currentUser();
    if (!u.userName) return;
    var key = u.userName + '|' + u.callName;
    if (!force && key === lastGreeted) return;
    lastGreeted = key; userGreeted = true;
    withEngine(function (en) { en.setUser(u); en.greet(u.callName + ', що будемо робити?'); });
    help.textContent = 'Сніговик уже вітається з тобою, ' + u.callName + '! Подивись у сцену.';
    if (callWrap.hidden) callToggle.hidden = false; // лагідне звертання — лише після першого привітання
    help.classList.add('is-live');
  }
  function openCall(open) { callWrap.hidden = !open; callToggle.setAttribute('aria-expanded', String(open)); callToggle.hidden = open; }
  nameInput.value = lsGet(LS_USER);
  callInput.value = lsGet(LS_CALL);
  if (callInput.value) openCall(true);
  callToggle.addEventListener('click', function () { openCall(true); callInput.focus(); });
  var debounce, revealT, revealedKey = '';
  function stageSeen() { var r = stage.getBoundingClientRect(); return r.top < innerHeight * 0.7 && r.bottom > innerHeight * 0.3; }
  function afterScroll(cb) {
    var done = false, iv, cap, last = -1, still = 0, start = window.scrollY, moved = false;
    function fin() { if (done) return; done = true; clearInterval(iv); clearTimeout(cap); window.removeEventListener('scrollend', fin); cb(); }
    window.addEventListener('scrollend', fin);
    cap = setTimeout(fin, 3000);
    // браузери без scrollend: чекаємо, поки прокрутка почнеться й зупиниться
    if (!('onscrollend' in window)) iv = setInterval(function () {
      moved = moved || Math.abs(window.scrollY - start) > 1;
      still = Math.abs(window.scrollY - last) < 1 ? still + 1 : 0; last = window.scrollY;
      if (moved && still >= 3) fin();
    }, 120);
  }
  function snowmanSeen() {
    var r = stage.getBoundingClientRect();
    var x = r.right - r.width * 0.05, y = r.bottom - r.height * 0.14;
    return x > 0 && x < innerWidth && y > 60 && y < innerHeight;
  }
  function sparksAtSnowman() {
    if (!snowmanSeen()) stage.scrollIntoView({ behavior: 'auto', block: 'center' });
    var r = stage.getBoundingClientRect();
    document.dispatchEvent(new CustomEvent('snizhok:spark', { detail: { x: r.right - r.width * 0.05, y: r.bottom - r.height * 0.14 } }));
  }
  // після паузи в наборі (або blur/Enter) один раз на нове імʼя показуємо сцену й іскри біля сніговика
  function reveal() {
    clearTimeout(revealT);
    var u = currentUser(); if (!u.userName) return;
    var key = u.userName + '|' + u.callName;
    if (key === revealedKey) return;
    revealedKey = key;
    greetUser(false);
    if (snowmanSeen()) { sparksAtSnowman(); return; }
    if (reduceMotion) { toast('Сніговик привітався — подивись у сцену нижче'); return; }
    stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    afterScroll(sparksAtSnowman);
  }
  function onInput() {
    var u = currentUser();
    lsSet(LS_USER, u.userName); lsSet(LS_CALL, clean(callInput.value));
    if (engine) engine.setUser(u);
    clearTimeout(debounce); clearTimeout(revealT);
    if (u.userName) {
      debounce = setTimeout(function () { greetUser(false); }, 600);
      revealT = setTimeout(reveal, 1200);
    }
  }
  nameInput.addEventListener('input', onInput);
  callInput.addEventListener('input', onInput);
  nameInput.addEventListener('blur', reveal);
  $('#name-form').addEventListener('submit', function (e) {
    e.preventDefault(); clearTimeout(debounce);
    if (!currentUser().userName) { help.textContent = 'Напиши своє імʼя, і сніговик привітається.'; help.classList.remove('is-live'); nameInput.focus(); return; }
    greetUser(true);
    var u = currentUser();
    revealedKey = u.userName + '|' + u.callName;
    clearTimeout(revealT);
    if (snowmanSeen()) { sparksAtSnowman(); return; }
    stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    if (!reduceMotion) afterScroll(sparksAtSnowman);
  });

  /* ---------- Шапка: фон зʼявляється лише після прокрутки ---------- */
  (function () {
    var top = $('.top'); if (!top) return;
    var on = function () { top.classList.toggle('is-scrolled', window.scrollY > 8); };
    on(); window.addEventListener('scroll', on, { passive: true });
  })();

  /* ---------- Телефон: «Спробуй зі своїм імʼям» і «Надіслати посилання собі» ---------- */
  $$('[data-try]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = $('#name-form').getBoundingClientRect();
      if (f.top >= 60 && f.bottom <= innerHeight) { nameInput.focus({ preventScroll: true }); return; }
      $('#name-form').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { nameInput.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    });
  });
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = CFG.SITE_URL || location.href;
      var text = 'Сніжок — новорічний сніг на робочому столі. Відкрий на компʼютері:';
      if (navigator.share) { navigator.share({ title: 'Сніжок', text: text, url: url }).catch(function () { /* скасовано */ }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast('Посилання скопійовано. Надішли його собі й відкрий на компʼютері.'); }, function () { toast('Скопіюй посилання: ' + url); });
      } else toast('Скопіюй посилання: ' + url);
    });
  });

  /* ---------- Кнопки «Покликати» / дії ---------- */
  var msg = { snowman: 'Сніговик іде', penguin: 'Пінгвін поспішає', squirrel: 'Білочка прибігла', tangerine: 'Мандаринка падає', gift: 'Подарунок летить' };
  function toStage(btn, after) {
    if (btn.hasAttribute('data-scroll')) {
      stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(after, reduceMotion ? 50 : 550);
    } else after();
    if (reduceMotion && !userStarted) { userStarted = true; $('#demo-play').hidden = true; sync(); }
  }
  $$('[data-spawn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-spawn');
      toStage(b, function () { withEngine(function (en) { en.spawn(kind); }); });
      toast(msg[kind] + ' — дивись у сцену');
    });
  });
  $$('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var act = b.getAttribute('data-act');
      toStage(b, function () {
        if (act === 'shake') shake();
        else withEngine(function (en) { en.callSnowmobile(); });
      });
      if (act === 'snowmobile') toast('Снігоходи виїхали — дивись у сцену');
    });
  });

  /* ---------- Сніг на літерах заголовків (декор, aria-hidden; текст лишається справжнім) ---------- */
  function snowCaps() {
    var hd = Math.min(2, window.devicePixelRatio || 1), dpr = 1; // контур шукаємо в CSS-px (швидко), малюємо в hd
    $$('.snowy').forEach(function (box) {
      if (box.getBoundingClientRect().top > innerHeight * 1.5) { box.dataset.capsPending = '1'; return; }
      delete box.dataset.capsPending;
      var head = box.querySelector('h1, h2'), cv = $('.snowy__caps', box);
      if (!head || !cv) return;
      var br = box.getBoundingClientRect(), cs = getComputedStyle(head);
      var fs = parseFloat(cs.fontSize), pad = Math.ceil(fs * 0.25);
      var W = Math.ceil(br.width), H = Math.ceil(br.height) + pad;
      cv.style.top = -pad + 'px'; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cv.width = Math.ceil(W * hd); cv.height = Math.ceil(H * hd);
      // 1) ті самі слова в прихованому canvas → верхній контур гліфів
      var off = document.createElement('canvas'); off.width = Math.ceil(W); off.height = Math.ceil(H);
      var o = off.getContext('2d', { willReadFrequently: true });
      o.scale(dpr, dpr);
      o.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      o.textBaseline = 'alphabetic'; o.fillStyle = '#000';
      var asc = o.measureText('Сніг').fontBoundingBoxAscent || fs * 0.9;
      var regions = [];
      $$('span', head).forEach(function (sp) {
        var rects = sp.getClientRects(); if (!rects.length) return;
        var rc = rects[0], x0 = rc.left - br.left, y0 = rc.top - br.top + pad;
        o.fillText(sp.textContent, x0, y0 + asc);
        regions.push([Math.max(0, Math.floor((x0 - 4) * dpr)), Math.ceil((x0 + rc.width + 4) * dpr), Math.max(0, Math.floor((y0 + asc - fs * 0.86) * dpr)), Math.ceil((y0 + asc) * dpr)]);
      });
      var img = o.getImageData(0, 0, off.width, off.height).data, w = off.width, hgt = off.height;
      var top = new Int32Array(w);
      // 2) шапки лише на пологих верхівках
      var g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(hd, 0, 0, hd, 0, 0);
      var T = fs * 0.075 * dpr, k = Math.max(2, Math.round(2 * dpr));
      function flat(x) { return top[x] >= 0 && top[x - k] >= 0 && top[x + k] >= 0 && Math.abs(top[x - k] - top[x]) <= k && Math.abs(top[x + k] - top[x]) <= k; }
      function draw(s, e) {
        if (e - s < 5 * dpr) return;
        var len = e - s, seed = s * 0.37, pts = [];
        for (var x = s - k; x <= e + k; x++) {
          var cx = Math.min(Math.max(x, s), e);
          var edge = Math.min(x - s + k, e + k - x) / (T * 1.4);
          var taper = Math.pow(Math.max(0, Math.min(1, edge)), 0.6);
          var t = T * (0.78 + 0.18 * Math.sin(x * 0.21 / dpr + seed) + 0.1 * Math.sin(x * 0.63 / dpr)) * taper * Math.min(1, len / (T * 3));
          pts.push([x, top[cx] - t]);
        }
        // біла шапка + тонкий холодний контур лише зверху (без смуги на самій літері)
        g.beginPath();
        g.moveTo(pts[0][0], top[s] + 2 * dpr);
        pts.forEach(function (p) { g.lineTo(p[0], p[1]); });
        for (var x = e + k; x >= s - k; x--) g.lineTo(x, top[Math.min(Math.max(x, s), e)] + 2.2 * dpr);
        g.closePath(); g.fillStyle = '#FFFFFF'; g.fill();
        g.beginPath();
        pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
        g.lineWidth = 1.2 * dpr; g.strokeStyle = 'rgba(160,190,240,.9)'; g.lineJoin = 'round'; g.stroke();
      }
      // кожне слово окремо: контур шукаємо лише в межах його рядка
      regions.forEach(function (r) {
        top.fill(-1);
        var x1 = Math.min(w, r[1]), y1 = Math.min(hgt, r[3]);
        // рядки накладаються (line-height 1.0): починаємо трохи нижче верху рядка і пропускаємо «хвости» літер попереднього рядка
        for (var x = r[0]; x < x1; x++) {
          var y = r[2], op = function (yy) { return img[(yy * w + x) * 4 + 3] > 140; };
          while (y < y1 && op(y)) y++;
          for (; y < y1; y++) if (op(y)) { top[x] = y; break; }
        }
        var start = -1;
        for (var x2 = Math.max(k, r[0]); x2 < Math.min(w - k, x1); x2++) {
          if (flat(x2)) { if (start < 0) start = x2; }
          else if (start >= 0) { draw(start, x2 - 1); start = -1; }
        }
        if (start >= 0) draw(start, Math.min(w - k, x1) - 1);
      });
    });
  }
  var capsTimer;
  function capsSoon() { clearTimeout(capsTimer); capsTimer = setTimeout(snowCaps, 120); }
  // перемальовуємо, коли Nunito справді завантажився і коли заголовок змінив розмір (перенос рядків)
  var capsIdle = function () { (window.requestIdleCallback || setTimeout)(snowCaps, { timeout: 1200 }); };
  if (document.fonts && document.fonts.load) document.fonts.load('900 1em Nunito').then(capsIdle, capsIdle); else capsIdle();
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(capsSoon); $$('.snowy').forEach(function (b) { ro.observe(b); }); }
  window.addEventListener('load', capsSoon);
  window.addEventListener('scroll', function () { if (document.querySelector('.snowy[data-caps-pending]')) capsSoon(); }, { passive: true });
  window.addEventListener('resize', capsSoon);

  /* ---------- Вхід героя: ~2,5 с після шапок снігу один проліт саней, раз за візит ---------- */
  (function () {
    var sky = $('#flight-sky'); if (!sky || reduceMotion) return;
    try { if (sessionStorage.getItem('snizhok.sleigh')) return; sessionStorage.setItem('snizhok.sleigh', '1'); } catch (e) { /* сховище недоступне: летимо без памʼяті */ }
    setTimeout(function () { sky.classList.add('is-flying'); }, 2500);
  })();

  /* ---------- Легкий сніг по всій сторінці: один canvas, ≤30 fps, DPR ≤ 1.5 ---------- */
  (function () {
    var c = $('#flakes'); if (!c || !c.getContext) return;
    var g = c.getContext('2d'), dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var W = 0, H = 0, flakes = [], crystals = [], last = 0, raf = 0;
    function make() {
      W = innerWidth; H = innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(reduceMotion ? 30 : 110, Math.round(W * H / 15000));
      flakes = []; crystals = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 1.9, v: 14 + Math.random() * 30, a: 0.25 + Math.random() * 0.5, p: Math.random() * 6.28 });
      var m = reduceMotion ? 2 : (W < 700 ? 2 : Math.max(3, Math.min(8, Math.round(W / 260))));
      for (var j = 0; j < m; j++) crystals.push({ x: Math.random() * W, y: Math.random() * H, r: 9 + Math.random() * 14, v: 10 + Math.random() * 12, a: (W < 700 ? 0.14 : 0.2) + Math.random() * 0.14, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, p: Math.random() * 6.28 });
    }
    function crystal(f) {
      g.save(); g.translate(f.x, f.y); g.rotate(f.rot);
      g.strokeStyle = 'rgba(225,236,255,' + f.a + ')'; g.lineWidth = 1.3; g.lineCap = 'round';
      g.beginPath();
      for (var k = 0; k < 6; k++) {
        g.rotate(Math.PI / 3);
        g.moveTo(0, 0); g.lineTo(0, -f.r);
        g.moveTo(0, -f.r * 0.55); g.lineTo(f.r * 0.25, -f.r * 0.75);
        g.moveTo(0, -f.r * 0.55); g.lineTo(-f.r * 0.25, -f.r * 0.75);
      }
      g.stroke(); g.restore();
    }
    function draw(dt, t) {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#FFFFFF';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.v * dt; f.x += Math.sin(t / 1400 + f.p) * 8 * dt + 4 * dt;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        if (f.x > W + 4) f.x = -4;
        g.globalAlpha = f.a; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      for (var j = 0; j < crystals.length; j++) {
        var q = crystals[j];
        q.y += q.v * dt; q.x += Math.sin(t / 2200 + q.p) * 6 * dt; q.rot += q.vr * dt;
        if (q.y > H + 30) { q.y = -30; q.x = Math.random() * W; }
        crystal(q);
      }
    }
    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (t - last < 33) return; // ~30 fps
      var dt = Math.min(0.1, (t - last) / 1000 || 0.033); last = t;
      draw(dt, t);
    }
    // стартуємо після завантаження сторінки, коли браузер вільний (не заважає першому відображенню)
    function start() { make(); if (reduceMotion) { draw(0, 0); } else { raf = requestAnimationFrame(loop); } }
    var idle2 = window.requestIdleCallback || function (cb) { return setTimeout(cb, 600); };
    var go = function () { idle2(start, { timeout: 2500 }); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { make(); if (reduceMotion) draw(0, 0); }, 150); });
    document.addEventListener('visibilitychange', function () {
      if (reduceMotion) return;
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && flakes.length) { last = 0; raf = requestAnimationFrame(loop); }
    });
  })();

  /* ---------- Пасхалка: набери «сніг» ---------- */
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'сніг' || typed === 'snig') { typed = ''; blizzard(); }
  });
  function blizzard() {
    if (engine && visible) { try { engine.celebrate(5); } catch (e) { /* немає салюту — не страшно */ } }
    if (reduceMotion) { toast('З наступаючим! Хай сніжить.'); return; }
    var c = $('#egg'), g = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    c.style.display = 'block';
    var flakes = [];
    for (var i = 0; i < 260; i++) flakes.push({ x: Math.random() * W, y: -Math.random() * H, r: (1 + Math.random() * 3) * dpr, v: (2 + Math.random() * 4) * dpr, d: Math.random() * 6 });
    var t0 = performance.now();
    toast('Хуртовина! З наступаючим.');
    (function f(t) {
      var k = (t - t0) / 5000;
      g.clearRect(0, 0, W, H);
      g.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
      flakes.forEach(function (p) {
        p.y += p.v; p.x += Math.sin((t / 600) + p.d) * dpr * 1.5 + 3 * dpr;
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
        if (p.x > W) p.x -= W;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fillStyle = '#9DB7DE'; g.fill();
      });
      if (k < 1) requestAnimationFrame(f); else { g.clearRect(0, 0, W, H); c.style.display = 'none'; }
    })(t0);
  }
})();
