/*
 * Список бажань. Два режими однієї сторінки:
 *   wishlist.html           — редактор (чернетка в localStorage, посилання оновлюється на льоту);
 *   wishlist.html#z=<дані>  — перегляд чужого списку (лише текст і http(s)-посилання).
 * Дані в посиланні (#z=, див. T.pack): плоский список полів [ім'я, заголовок, потім по 5 на бажання:
 * назва, посилання, ціна, коментар, «дуже хочу» (1 або порожньо)]. Старі посилання #w=<JSON {v:1, n, h, i:[…]}> відкриваються як раніше.
 * Посилання стиснене, але не зашифроване: хто його має, той бачить увесь список.
 * wishlist.html?back=santa&slot=N — редактор із кнопкою «додати до Санти»: посилання потрапляє в поле учасника N.
 */
(function () {
  'use strict';
  var T = window.SnizhokTools, $ = T.$, el = T.el;
  var LS = 'snizhok.wishlist', MAX_ITEMS = 40, LONG_LINK = 3500;
  var DEFAULT_HEAD = 'Мої бажання на Новий рік';

  function holidayYear() {
    var d = new Date();
    return d.getMonth() === 0 && d.getDate() <= 14 ? d.getFullYear() : d.getFullYear() + 1;
  }
  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : (a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many);
  }

  /* ---------- Лист (спільний для попереднього перегляду й перегляду друзями) ---------- */
  function renderPaper(box, data, opts) {
    opts = opts || {};
    box.textContent = '';
    var stamp = el('div', { class: 'paper__stamp', 'aria-hidden': 'true' }, [T.icon('i-snow'), el('span', { text: String(holidayYear()) })]);
    box.appendChild(stamp);
    box.appendChild(el('p', { class: 'paper__kicker', text: data.name ? 'Список бажань · ' + data.name : 'Список бажань' }));
    box.appendChild(el('h2', { class: 'paper__name', text: data.head || DEFAULT_HEAD }));

    var items = data.items.filter(function (it) { return it.t.trim(); });
    if (!items.length) {
      box.appendChild(el('p', { class: 'paper__empty', text: 'Тут з’явиться твій список — так його побачать друзі.' }));
      return;
    }
    var list = el('ol', { class: 'paper__list' });
    items.forEach(function (it, i) {
      var title = el('p', { class: 'paper__t' }, [it.t.trim()]);
      if (it.s) title.appendChild(el('span', { class: 'paper__badge', text: 'дуже хочу' }));
      var li = el('li', null, [el('span', { class: 'paper__n', 'aria-hidden': 'true', text: String(i + 1) }), title]);

      var meta = [];
      if (it.p.trim()) meta.push(el('b', { text: it.p.trim() }));
      if (it.c.trim()) meta.push(document.createTextNode((meta.length ? ' · ' : '') + it.c.trim()));
      if (meta.length) li.appendChild(el('p', { class: 'paper__meta' }, meta));

      var url = T.safeUrl(it.u);
      if (url) {
        li.appendChild(el('p', null, [el('a', { href: url, target: '_blank', rel: 'noopener noreferrer nofollow' },
          ['Глянути на ' + T.host(url), T.icon('i-ext')])]));
      }
      if (opts.takeKey) {
        var taken = !!opts.taken[i];
        var btn = el('button', { type: 'button', class: 'paper__take', 'aria-pressed': String(taken) });
        var paint = function () {
          btn.textContent = '';
          if (taken) btn.appendChild(T.icon('i-check'));
          btn.appendChild(document.createTextNode(taken ? 'Я подарую це' : 'Я подарую'));
          btn.setAttribute('aria-pressed', String(taken));
        };
        btn.addEventListener('click', function () {
          taken = !taken; opts.taken[i] = taken ? 1 : 0;
          T.lsSet(opts.takeKey, opts.taken); paint();
        });
        paint();
        li.appendChild(btn);
      }
      list.appendChild(li);
    });
    box.appendChild(list);
    box.appendChild(el('p', { class: 'paper__foot', text: items.length + ' ' + plural(items.length, 'бажання', 'бажання', 'бажань') + ' · складено у Сніжку' }));
  }

  /* ---------- Перегляд ---------- */
  function hash32(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  function parsePayload(o) {
    if (o.v !== 1 || !Array.isArray(o.i)) throw new Error('bad wishlist');
    return {
      name: T.str(o.n, 40), head: T.str(o.h, 60),
      items: o.i.slice(0, MAX_ITEMS).map(function (r) {
        r = Array.isArray(r) ? r : [];
        return { t: T.str(r[0], 80), u: T.str(r[1], 500), p: T.str(r[2], 30), c: T.str(r[3], 120), s: r[4] ? 1 : 0 };
      }).filter(function (it) { return it.t.trim(); }),
    };
  }

  function parseFlat(f) {
    var items = [];
    for (var k = 2; k < f.length && items.length < MAX_ITEMS; k += 5) {
      items.push({ t: T.str(f[k], 80), u: T.str(f[k + 1], 500), p: T.str(f[k + 2], 30), c: T.str(f[k + 3], 120), s: f[k + 4] ? 1 : 0 });
    }
    return { name: T.str(f[0], 40), head: T.str(f[1], 60), items: items.filter(function (it) { return it.t.trim(); }) };
  }
  function readLink(kind) {
    if (!kind.value) return Promise.reject(new Error('empty'));
    if (kind.key === 'z') return T.unpack(kind.value).then(parseFlat);
    if (kind.key === 'w') return T.decode(kind.value).then(parsePayload);
    return Promise.reject(new Error('unknown'));
  }

  function showView(kind) {
    var raw = kind.value;
    readLink(kind).then(function (data) {
      if (!data.items.length) throw new Error('empty');
      var key = 'snizhok.wl.take.' + hash32(raw);
      renderPaper($('#wl-view-paper'), data, { takeKey: key, taken: T.lsGet(key, []) || [] });
      var who = data.name || 'Друг';
      $('#wl-view-title').textContent = who + ' ділиться бажаннями';
      $('#wl-view-lead').textContent = 'Обери, що подаруєш, і познач для себе — щоб не забути. ' + who + ' про позначки не дізнається.';
      document.title = 'Список бажань' + (data.name ? ' · ' + data.name : '') + ' — Сніжок';
      $('#wl-view').hidden = false;
    }).catch(function () { $('#wl-bad').hidden = false; });
  }

  /* ---------- Редактор ---------- */
  var state, linkTimer, currentLink = '';

  function blank() { return { t: '', u: '', p: '', c: '', s: 0 }; }
  function load() {
    var s = T.lsGet(LS, null);
    if (!s || !Array.isArray(s.items)) return { name: '', head: '', items: [] };
    return {
      name: T.str(s.name, 40), head: T.str(s.head, 60),
      items: s.items.slice(0, MAX_ITEMS).map(function (it) {
        return { t: T.str(it.t, 80), u: T.str(it.u, 500), p: T.str(it.p, 30), c: T.str(it.c, 120), s: it.s ? 1 : 0 };
      }),
    };
  }
  function filled() { return state.items.filter(function (it) { return it.t.trim(); }); }

  function changed() {
    T.lsSet(LS, state);
    renderPaper($('#wl-preview'), state);
    var n = filled().length;
    $('#wl-count').textContent = state.items.length >= MAX_ITEMS ? 'У списку максимум ' + MAX_ITEMS + ' бажань.' : '';
    $('#wl-add').disabled = state.items.length >= MAX_ITEMS;
    $('#wl-empty').hidden = state.items.length > 0;
    clearTimeout(linkTimer);
    linkTimer = setTimeout(buildLink, 200);
    if (!n) setShare('');
  }

  function buildLink() {
    var items = filled();
    if (!items.length) return setShare('');
    var fields = [state.name.trim(), state.head.trim()];
    items.forEach(function (it) { fields.push(it.t.trim(), T.safeUrl(it.u), it.p.trim(), it.c.trim(), it.s ? '1' : ''); });
    T.pack(fields).then(function (code) { setShare(T.pageUrl('wishlist.html') + '#z=' + code); });
  }

  function setShare(link) {
    currentLink = link;
    var on = !!link;
    $('#wl-link').value = link;
    $('#wl-copy').setAttribute('aria-disabled', String(!on));
    var tg = $('#wl-tg');
    tg.setAttribute('aria-disabled', String(!on));
    tg.href = on ? T.tgUrl(link, shareText()) : '#';
    var vb = $('#wl-viber');
    vb.setAttribute('aria-disabled', String(!on));
    vb.href = on ? T.viberUrl(link, shareText()) : '#';
    var back = $('#wl-back');
    back.setAttribute('aria-disabled', String(!on));
    var hint = $('#wl-share-hint');
    if (!on) hint.textContent = 'Додай хоча б одне бажання — і з’явиться посилання.';
    else if (link.length > LONG_LINK) hint.textContent = 'Посилання вийшло довгим (' + link.length + ' із ' + LONG_LINK + ' символів) — деякі месенджери можуть його обрізати. Скороти коментарі або прибери кілька бажань.';
    else hint.textContent = 'Одне посилання для всіх: хто відкриє — побачить твій лист. Довжина: ' + link.length + ' із ' + LONG_LINK + ' символів.';
    document.body.setAttribute('data-wl-link', on ? 'ready' : 'none'); // для автотесту
  }
  function shareText() { return (state.name.trim() ? state.name.trim() + ': мій' : 'Мій') + ' список бажань на Новий рік 🎁'; }

  function field(labelText, input) {
    var id = 'wl-f' + (field.n = (field.n || 0) + 1);
    input.id = id;
    return el('div', { class: 't-field' }, [el('label', { class: 't-mini', for: id, text: labelText }), input]);
  }

  function renderItems(focusIndex, focusWhat) {
    var list = $('#wl-items');
    list.textContent = '';
    state.items.forEach(function (it, i) {
      var num = i + 1;
      var bind = function (key, input) {
        input.value = it[key];
        input.addEventListener('input', function () { it[key] = input.value; changed(); });
        return input;
      };
      var title = bind('t', el('input', { class: 'input', maxlength: 80, 'aria-label': 'Бажання ' + num, placeholder: 'Наприклад: теплі шкарпетки з оленями', 'data-title': '' }));
      title.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (i === state.items.length - 1) add(); else focusTitle(i + 1); }
      });
      var star = el('button', { type: 'button', class: 't-iconbtn', 'aria-pressed': String(!!it.s), 'aria-label': 'Дуже хочу: бажання ' + num, title: 'Дуже хочу' }, [T.icon('i-star')]);
      star.addEventListener('click', function () { it.s = it.s ? 0 : 1; star.setAttribute('aria-pressed', String(!!it.s)); changed(); });

      var link = bind('u', el('input', { class: 'input', maxlength: 500, inputmode: 'url', placeholder: 'https://…' }));
      var linkErr = el('p', { class: 't-err', hidden: true, text: 'Схоже, це не посилання. Перевір адресу.' });
      link.addEventListener('blur', function () {
        var bad = !!link.value.trim() && !T.safeUrl(link.value);
        link.setAttribute('aria-invalid', String(bad)); linkErr.hidden = !bad;
      });
      var linkField = field('Посилання', link); linkField.appendChild(linkErr);
      var price = bind('p', el('input', { class: 'input', maxlength: 30, placeholder: '≈ 400 грн' }));
      var note = bind('c', el('input', { class: 'input', maxlength: 120, placeholder: 'Розмір, колір, де шукати' }));

      var up = el('button', { type: 'button', class: 't-iconbtn', 'aria-label': 'Підняти вище: бажання ' + num, title: 'Вище', disabled: i === 0 }, [T.icon('i-up')]);
      up.addEventListener('click', function () { move(i, -1); });
      var down = el('button', { type: 'button', class: 't-iconbtn', 'aria-label': 'Опустити нижче: бажання ' + num, title: 'Нижче', disabled: i === state.items.length - 1 }, [T.icon('i-down')]);
      down.addEventListener('click', function () { move(i, 1); });
      var del = el('button', { type: 'button', class: 't-iconbtn t-iconbtn--danger', 'aria-label': 'Видалити бажання ' + num, title: 'Видалити' }, [T.icon('i-trash')]);
      del.addEventListener('click', function () { remove(i); });

      list.appendChild(el('li', { class: 't-item' }, [
        el('div', { class: 't-item__top' }, [el('span', { class: 't-n', 'aria-hidden': 'true', text: String(num) }), title, star]),
        el('div', { class: 't-item__more' }, [linkField, field('Ціна', price), field('Коментар', note)]),
        el('div', { class: 't-item__acts' }, [up, down, del]),
      ]));
    });
    if (focusIndex != null) {
      var row = list.children[Math.max(0, Math.min(focusIndex, list.children.length - 1))];
      var target = row && (focusWhat ? row.querySelector(focusWhat) : row.querySelector('[data-title]'));
      if (target && !target.disabled) target.focus(); else if (row) row.querySelector('[data-title]').focus(); else $('#wl-add').focus();
    }
  }
  function focusTitle(i) { var row = $('#wl-items').children[i]; if (row) row.querySelector('[data-title]').focus(); }

  function add() {
    if (state.items.length >= MAX_ITEMS) return;
    state.items.push(blank());
    renderItems(state.items.length - 1); changed();
  }
  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= state.items.length) return;
    var tmp = state.items[i]; state.items[i] = state.items[j]; state.items[j] = tmp;
    renderItems(j, dir < 0 ? '[aria-label^="Підняти"]' : '[aria-label^="Опустити"]'); changed();
  }
  function remove(i) {
    var gone = state.items.splice(i, 1)[0];
    renderItems(state.items.length ? Math.min(i, state.items.length - 1) : null); changed();
    if (!state.items.length) $('#wl-add').focus();
    if (gone.t.trim()) {
      T.toast('Видалено: ' + gone.t.trim(), 'Повернути', function () {
        state.items.splice(Math.min(i, state.items.length), 0, gone);
        renderItems(Math.min(i, state.items.length - 1)); changed();
      });
    }
  }

  function initEditor() {
    state = load();
    var first = !T.lsGet(LS, null);
    if (first) {
      try { state.name = (localStorage.getItem('snizhok.userName') || '').slice(0, 40); } catch (e) { /* приватний режим */ }
    }
    var name = $('#wl-name'), head = $('#wl-head');
    name.value = state.name; head.value = state.head;
    name.addEventListener('input', function () { state.name = name.value; changed(); });
    head.addEventListener('input', function () { state.head = head.value; changed(); });
    $('#wl-form').addEventListener('submit', function (e) { e.preventDefault(); });
    $('#wl-add').addEventListener('click', add);

    $('#wl-copy').addEventListener('click', function () {
      if (!currentLink) return;
      T.copyWith(this, currentLink, 'Посилання скопійовано — встав його в чат друзям.',
        'Не вдалося скопіювати автоматично. Посилання виділено — скопіюй його вручну.', $('#wl-link'));
    });
    $('#wl-tg').addEventListener('click', function (e) { if (!currentLink) e.preventDefault(); });
    $('#wl-viber').addEventListener('click', function (e) { if (!currentLink) e.preventDefault(); });
    initBack();
    $('#wl-link').addEventListener('focus', function () { this.select(); });
    if (T.canShare()) {
      var nat = $('#wl-native'); nat.hidden = false;
      nat.addEventListener('click', function () { if (currentLink) T.share('Список бажань', shareText(), currentLink); });
    }

    if (!state.items.length) state.items.push(blank());
    renderItems(); changed();
    $('#wl-editor').hidden = false;
  }

  /* Повернення до Таємного Санти: лише номер учасника з адреси, посилання пишемо в його поле. */
  function initBack() {
    var m = /^\?(?:.*&)?back=santa(?:&.*)?$/.test(location.search) && /[?&]slot=(\d{1,2})(?:&|$)/.exec(location.search);
    var slot = m ? +m[1] : -1;
    if (slot < 0 || slot > 39) return;
    var btn = $('#wl-back');
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (!currentLink) return;
      var santa = T.lsGet('snizhok.santa', null);
      if (santa && Array.isArray(santa.people) && santa.people[slot]) {
        santa.people[slot].w = currentLink;
        T.lsSet('snizhok.santa', santa);
      }
      location.href = 'santa.html';
    });
  }

  function route() {
    var kind = T.hashParamAny();
    ['#wl-editor', '#wl-view', '#wl-bad'].forEach(function (s) { $(s).hidden = true; });
    if (kind) showView(kind); else initEditor();
  }
  document.addEventListener('DOMContentLoaded', route);
  addEventListener('hashchange', function () { location.reload(); });
})();
