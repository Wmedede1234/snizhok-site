/*
 * Таємний Санта. Два режими однієї сторінки:
 *   santa.html           — організатор: імена → жеребкування в браузері → особисті посилання;
 *   santa.html#z=<дані>  — учасник: бачить лише те, кому дарує саме він.
 * Дані в посиланні (#z=, див. T.pack): поля [подія, хто дарує, кому, бюджет, дата, слово організатора, список бажань].
 * Старі посилання #s=<JSON {v:1, e, g, r, b, d, m, w}> відкриваються як раніше.
 * Посилання стиснене, але не зашифроване, а сервера немає: хто має посилання, той може його прочитати.
 * Організатор теж технічно може відкрити чуже посилання — сторінка цього не показує й чесно про це каже.
 */
(function () {
  'use strict';
  var T = window.SnizhokTools, $ = T.$, el = T.el;
  var LS = 'snizhok.santa', MIN = 3, MAX = 40, WISH_MAX = 4000;
  var state;

  function blank() { return { n: '', w: '' }; }
  function load() {
    var s = T.lsGet(LS, null) || {};
    var people = Array.isArray(s.people) ? s.people.slice(0, MAX).map(function (p) { return { n: T.str(p.n, 40), w: T.str(p.w, WISH_MAX) }; }) : [];
    while (people.length < MIN) people.push(blank());
    var result = Array.isArray(s.result) && s.result.length >= MIN
      ? s.result.map(function (r) { return { n: T.str(r.n, 40), link: T.str(r.link, 8000), sent: !!r.sent }; }) : null;
    return { event: T.str(s.event, 50), budget: T.str(s.budget, 30), date: T.str(s.date, 10), note: T.str(s.note, 140), people: people, result: result };
  }
  function save() { T.lsSet(LS, state); }

  function fmtDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    var d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' });
  }

  /* ---------- Випадковість: криптографічний генератор, без зсуву ---------- */
  function randInt(n) {
    var buf = new Uint32Array(1), limit = Math.floor(0x100000000 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  /* Одне коло: кожен дарує наступному в перемішаному порядку — ніхто не дарує собі. */
  function drawPairs(count) {
    var order = [];
    for (var i = 0; i < count; i++) order.push(i);
    for (var k = count - 1; k > 0; k--) { var j = randInt(k + 1), t = order[k]; order[k] = order[j]; order[j] = t; }
    var to = new Array(count);
    for (var m = 0; m < count; m++) to[order[m]] = order[(m + 1) % count];
    return to;
  }

  /* ---------- Організатор: форма ---------- */
  function setStep(n) {
    T.$$('#ss-steps li').forEach(function (li) {
      var s = +li.getAttribute('data-step');
      li.classList.toggle('is-done', s < n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }

  function renderPeople(focusIndex) {
    var list = $('#ss-people');
    list.textContent = '';
    state.people.forEach(function (p, i) {
      var num = i + 1;
      var name = el('input', { class: 'input', id: 'ss-n' + i, maxlength: 40, 'aria-label': 'Ім’я учасника ' + num, placeholder: 'Ім’я', 'aria-describedby': 'ss-ne' + i });
      name.value = p.n;
      name.addEventListener('input', function () { p.n = name.value; clearErr(name, 'ss-ne' + i); save(); paintCount(); });
      name.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i === state.people.length - 1) addPerson(); else $('#ss-n' + (i + 1)).focus();
      });
      var wish = el('input', { class: 'input', id: 'ss-w' + i, maxlength: WISH_MAX, inputmode: 'url', 'aria-label': 'Посилання на список бажань учасника ' + num + ', необов’язково', placeholder: 'Список бажань — посилання, необов’язково', 'aria-describedby': 'ss-we' + i });
      wish.value = p.w;
      wish.addEventListener('input', function () { p.w = wish.value; clearErr(wish, 'ss-we' + i); save(); });
      wish.addEventListener('blur', function () {
        if (wish.value.trim() && !T.safeUrl(wish.value)) setErr(wish, 'ss-we' + i, 'Це не схоже на посилання.');
      });
      var del = el('button', { type: 'button', class: 't-iconbtn t-iconbtn--danger', 'aria-label': 'Прибрати учасника ' + num, title: 'Прибрати', disabled: state.people.length <= MIN }, [T.icon('i-trash')]);
      del.addEventListener('click', function () {
        state.people.splice(i, 1); save();
        renderPeople(Math.min(i, state.people.length - 1));
      });
      list.appendChild(el('li', { class: 't-person' }, [
        el('span', { class: 't-n', 'aria-hidden': 'true', text: String(num) }),
        el('div', { class: 't-person__f' }, [name, el('p', { class: 't-err', id: 'ss-ne' + i, hidden: true })]),
        el('div', { class: 't-person__f t-person__f--wish' }, [wish, el('p', { class: 't-err', id: 'ss-we' + i, hidden: true }),
          el('a', { class: 'btn btn--ghost t-mk', href: 'wishlist.html?back=santa&slot=' + i, 'aria-label': 'Створити список бажань для учасника ' + num }, [T.icon('i-gift'), 'Створити вішліст'])]),
        del,
      ]));
    });
    $('#ss-add').disabled = state.people.length >= MAX;
    paintCount();
    if (focusIndex != null) { var f = $('#ss-n' + focusIndex); if (f) f.focus(); }
  }
  /* Підказка про мінімум учасників: рахуємо лише рядки з іменем. */
  function paintCount() {
    var n = state.people.filter(function (p) { return p.n.trim(); }).length, box = $('#ss-count');
    box.textContent = n >= MIN ? 'Учасників: ' + n + '. Можна проводити жеребкування.' : 'Учасників: ' + n + '. Для жеребкування потрібно щонайменше ' + MIN + '.';
  }
  function setErr(input, errId, text) {
    var e = document.getElementById(errId);
    input.setAttribute('aria-invalid', 'true'); e.textContent = text; e.hidden = false;
  }
  function clearErr(input, errId) {
    var e = document.getElementById(errId);
    input.removeAttribute('aria-invalid'); if (e) { e.hidden = true; e.textContent = ''; }
  }
  function addPerson() {
    if (state.people.length >= MAX) return;
    state.people.push(blank()); save();
    renderPeople(state.people.length - 1);
  }

  /* Перевірка: повертає список учасників або показує помилки (біля полів і зведенням угорі). */
  function validate() {
    var errors = [], seen = {}, players = [];
    state.people.forEach(function (p, i) {
      var n = p.n.trim().replace(/\s+/g, ' '), wRaw = p.w.trim(), w = T.safeUrl(wRaw);
      var nameInput = $('#ss-n' + i), wishInput = $('#ss-w' + i);
      clearErr(nameInput, 'ss-ne' + i); clearErr(wishInput, 'ss-we' + i);
      if (!n && !wRaw) return;
      if (!n) { setErr(nameInput, 'ss-ne' + i, 'Впиши ім’я.'); errors.push({ id: 'ss-n' + i, text: 'Учасник ' + (i + 1) + ': немає імені' }); return; }
      var key = n.toLocaleLowerCase('uk');
      if (seen[key]) {
        setErr(nameInput, 'ss-ne' + i, 'Таке ім’я вже є. Додай прізвище чи першу літеру.');
        errors.push({ id: 'ss-n' + i, text: '«' + n + '» повторюється — розрізни імена' });
      }
      seen[key] = true;
      if (wRaw && !w) { setErr(wishInput, 'ss-we' + i, 'Це не схоже на посилання.'); errors.push({ id: 'ss-w' + i, text: n + ': посилання на список бажань не відкриється' }); }
      players.push({ n: n, w: w });
    });
    if (players.length < MIN) {
      var firstEmpty = 0;
      state.people.some(function (p, i) { if (!p.n.trim()) { firstEmpty = i; return true; } return false; });
      errors.unshift({ id: 'ss-n' + firstEmpty, text: 'Потрібно щонайменше ' + MIN + ' учасники — зараз ' + players.length });
    }
    var box = $('#ss-summary'), ul = $('#ss-summary-list');
    ul.textContent = '';
    if (errors.length) {
      errors.forEach(function (e) { ul.appendChild(el('li', null, [el('a', { href: '#' + e.id, text: e.text })])); });
      box.hidden = false;
      var first = $('#' + errors[0].id);
      if (first) first.focus();
      return null;
    }
    box.hidden = true;
    return players;
  }

  function draw(players) {
    var to = drawPairs(players.length);
    var base = T.pageUrl('santa.html') + '#z=';
    return Promise.all(players.map(function (p, i) {
      var r = players[to[i]];
      return T.pack([state.event.trim(), p.n, r.n, state.budget.trim(), state.date, state.note.trim(), r.w])
        .then(function (code) { return { n: p.n, link: base + code, sent: false }; });
    })).then(function (result) {
      state.result = result; save();
      showResult(true);
    });
  }

  /* ---------- Організатор: посилання ---------- */
  /* Текст повідомлення: лише ім'я того, кому пишемо, — без пар «хто кому». */
  function tgText(name) {
    var ev = state.event.trim();
    return name + ', це твоє особисте посилання для гри «' + (ev || 'Таємний Санта') + '». Відкрий — дізнаєшся, кому даруєш. Нікому не показуй! 🎅';
  }
  function paintProgress() {
    var sent = state.result.filter(function (r) { return r.sent; }).length, all = state.result.length;
    $('#ss-progress').textContent = sent === all ? 'Усі ' + all + ' посилань надіслано. Гарного свята!' : 'Надіслано ' + sent + ' з ' + all;
  }
  function showResult(focus) {
    var list = $('#ss-links');
    list.textContent = '';
    state.result.forEach(function (r) {
      var stateLabel = el('span', { class: 't-links__state' });
      var li = el('li');
      var paint = function () {
        li.classList.toggle('is-sent', r.sent);
        stateLabel.textContent = r.sent ? 'надіслано ✓' : 'ще не надіслано';
      };
      var mark = function () { r.sent = true; save(); paint(); paintProgress(); };
      var manual = null; // поле для ручного копіювання, якщо буфер обміну недоступний
      var copy = el('button', { type: 'button', class: 'btn btn--ghost', 'aria-label': 'Скопіювати посилання для: ' + r.n }, [T.icon('i-copy'), 'Скопіювати']);
      copy.addEventListener('click', function () {
        if (!manual) {
          manual = el('input', { class: 'input t-links__manual', readonly: true, 'aria-label': 'Посилання для: ' + r.n, hidden: true });
          manual.value = r.link;
          li.appendChild(manual);
        }
        T.copy(r.link).then(function (ok) {
          if (ok) {
            manual.hidden = true; mark();
            T.flash(copy, 'Скопійовано');
            T.toast(r.n + ': посилання скопійовано. Встав його в особисте повідомлення.');
          } else {
            manual.hidden = false; manual.focus(); manual.select();
            T.toast('Не вдалося скопіювати автоматично. Посилання виділено — скопіюй його вручну.');
          }
        });
      });
      var btns = [copy];
      if (T.canShare()) {
        var nat = el('button', { type: 'button', class: 'btn btn--ghost', 'aria-label': 'Поділитися посиланням для: ' + r.n }, [T.icon('i-share'), 'Поділитися']);
        nat.addEventListener('click', function () {
          T.share('Таємний Санта', tgText(r.n), r.link).then(function (ok) { if (ok) mark(); });
        });
        btns.unshift(nat);
      }
      var tg = el('a', { class: 'btn btn--ghost', href: T.tgUrl(r.link, tgText(r.n)), target: '_blank', rel: 'noopener', 'aria-label': 'Надіслати в Telegram для: ' + r.n }, [T.icon('i-send'), 'Telegram']);
      tg.addEventListener('click', mark);
      var vb = el('a', { class: 'btn btn--ghost', href: T.viberUrl(r.link, tgText(r.n)), rel: 'noopener', 'aria-label': 'Надіслати у Viber для: ' + r.n }, [T.icon('i-send'), 'Viber']);
      vb.addEventListener('click', mark);
      btns.push(tg, vb);
      li.appendChild(el('div', { class: 't-links__who' }, [el('span', { text: r.n }), stateLabel]));
      li.appendChild(el('div', { class: 't-links__btns' }, btns));
      paint();
      list.appendChild(li);
    });
    paintProgress();
    $('#ss-form').hidden = true;
    $('#ss-result').hidden = false;
    setStep(3);
    if (focus) { var h = $('#ss-result-title'); h.focus(); h.scrollIntoView({ block: 'start', behavior: 'auto' }); }
  }
  function showForm(focus) {
    $('#ss-result').hidden = true;
    $('#ss-form').hidden = false;
    setStep(1);
    renderPeople(focus ? 0 : null);
  }

  function initOrganizer() {
    state = load();
    [['#ss-event', 'event'], ['#ss-budget', 'budget'], ['#ss-date', 'date'], ['#ss-note', 'note']].forEach(function (pair) {
      var input = $(pair[0]);
      input.value = state[pair[1]];
      input.addEventListener('input', function () { state[pair[1]] = input.value; save(); });
    });
    var today = new Date();
    $('#ss-date').min = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);

    $('#ss-add').addEventListener('click', addPerson);
    $('#ss-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var players = validate();
      if (!players) return;
      var btn = $('#ss-draw');
      btn.disabled = true; setStep(2);
      draw(players).then(function () { btn.disabled = false; }, function () {
        btn.disabled = false; setStep(1);
        T.toast('Не вдалося провести жеребкування. Онови сторінку й спробуй ще раз.');
      });
    });
    $('#ss-redraw').addEventListener('click', function () {
      if (!confirm('Провести жеребкування заново?\n\nУже надіслані посилання стануть неправильними — доведеться розіслати всім нові.')) return;
      var players = state.people.map(function (p) { return { n: p.n.trim().replace(/\s+/g, ' '), w: T.safeUrl(p.w) }; }).filter(function (p) { return p.n; });
      draw(players).then(function () { T.toast('Нове жеребкування готове. Розішли посилання ще раз.'); });
    });
    $('#ss-edit').addEventListener('click', function () {
      var anySent = state.result && state.result.some(function (r) { return r.sent; });
      if (anySent && !confirm('Змінити учасників?\n\nПісля нового жеребкування вже надіслані посилання стануть неправильними.')) return;
      state.result = null; save();
      showForm(true);
    });

    $('#ss-org').hidden = false;
    if (state.result) { renderPeople(); showResult(false); } else showForm(false);
  }

  /* ---------- Учасник ---------- */
  /* Нове (#z=) і старе (#s=) посилання приводимо до одного вигляду; усе інше — помилка. */
  function readLink(kind) {
    if (!kind || !kind.value) return Promise.reject(new Error('empty'));
    if (kind.key === 'z') {
      return T.unpack(kind.value).then(function (f) { return { e: f[0], g: f[1], r: f[2], b: f[3], d: f[4], m: f[5], w: f[6] }; });
    }
    if (kind.key === 's') {
      return T.decode(kind.value).then(function (o) { if (o.v !== 1) throw new Error('version'); return o; });
    }
    return Promise.reject(new Error('unknown'));
  }
  function showMe(kind) {
    readLink(kind).then(function (o) {
      var giver = T.str(o.g, 40).trim(), recv = T.str(o.r, 40).trim();
      if (!giver || !recv) throw new Error('bad santa link');
      var ev = T.str(o.e, 50).trim() || 'Таємний Санта';
      $('#ss-me-event').textContent = ev;
      $('#ss-me-title').textContent = 'Привіт, ' + giver + '!';
      $('#ss-me-name').textContent = recv;
      document.title = ev + ' — твоє посилання | Сніжок';

      var facts = $('#ss-me-facts');
      [['Бюджет', T.str(o.b, 30).trim()], ['Обмін', fmtDate(T.str(o.d, 10))], ['Організатор', T.str(o.m, 140).trim()]].forEach(function (f) {
        if (f[1]) facts.appendChild(el('div', null, [el('dt', { text: f[0] }), el('dd', { text: f[1] })]));
      });
      var acts = $('#ss-me-acts'), wish = T.safeUrl(T.str(o.w, WISH_MAX));
      if (wish) {
        acts.appendChild(el('a', { class: 'btn btn--cta', href: wish, target: '_blank', rel: 'noopener noreferrer' }, [T.icon('i-gift'), 'Список бажань: ' + recv]));
      } else {
        acts.appendChild(el('p', { class: 'small', text: 'Списку бажань немає — доведеться вгадувати. Так навіть цікавіше.' }));
      }

      var open = $('#ss-open'), out = $('#ss-out'), live = $('#ss-live');
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var reveal = function () {
        open.hidden = true; open.classList.remove('is-opening');
        out.hidden = false;
        $('#ss-me-lead').textContent = 'Запам’ятай ім’я й тримай у таємниці.';
        live.textContent = 'Ти даруєш подарунок для: ' + recv;
        $('#ss-hide').focus({ preventScroll: true });
      };
      open.addEventListener('click', function () {
        if (open.classList.contains('is-opening')) return;
        if (reduce) return reveal();
        open.classList.add('is-opening');
        setTimeout(reveal, 520);
      });
      $('#ss-hide').addEventListener('click', function () {
        out.hidden = true; open.hidden = false;
        $('#ss-me-lead').textContent = 'Ім’я сховано. Відкрий подарунок, коли ніхто не підглядає.';
        live.textContent = 'Ім’я сховано';
        open.focus({ preventScroll: true });
      });

      $('#ss-also').hidden = true; // у картці учасника вже є свої наступні кроки
      $('#ss-me').hidden = false;
    }).catch(function () { $('#ss-bad').hidden = false; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var kind = T.hashParamAny();
    if (kind) showMe(kind); else initOrganizer();
  });
  addEventListener('hashchange', function () { location.reload(); });
})();
