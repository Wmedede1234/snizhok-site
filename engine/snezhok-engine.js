/*!
 * Сніжок — рушій новорічної анімації (сніг, кучугури, шапки на вікнах, персонажі).
 * Чистий JS (ES2020), без залежностей і збирання. UMD → window.Snezhok (назва глобалу збережена для сумісності API).
 * Спрайти: власні 3D-рендери (tools/render3d, three.js) і Microsoft Fluent Emoji 3D (MIT), див. assets/ATTRIBUTION.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Snezhok = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '2.0.0';

  // ------------------------------------------------------------------ defaults
  const DEFAULT_SETTINGS = Object.freeze({
    snow: true, intensity: 0, wind: 1, drifts: true, windowCaps: true, cursor: true,
    tangerines: true, surprises: true, snowmen: true, penguins: true, squirrels: true,
    sleigh: true, garland: true, snowmobiles: true, snowmobileEvery: 30, voice: true,
    idleMinutes: 5, onlyOnBattery: false, sounds: true, launchAtLogin: true, calm: false,
    // v2.1: бурульки під вікнами з шапкою, сніг на значках робочого столу (kind:'icon'), сніжки між персонажами
    icicles: true, iconCaps: true, snowballFights: true,
  });

  // Гендерно-нейтральні фрази. {ім'я} — як звертатися, {дні} — «49 днів». (Старі {имя}/{дни} теж працюють.)
  const DEFAULT_PHRASES = Object.freeze([
    "{ім'я}, що будемо робити?",
    "{ім'я}, мандаринку хочеш?",
    'До Нового року лишилось {дні}!',
    "Сніговик сумує без тебе, {ім'я}!",
    "{ім'я}, може, какао з зефірками?",
    "Ау, {ім'я}! Ялинка питає, де ти.",
    "{ім'я}, час загадувати бажання!",
    "{ім'я}, тут мандаринки самі з неба падають!",
    "Ще {дні} до свята, {ім'я}! Ялинку вже прикрасили?",
    "{ім'я}, білочки просять горішків!",
    "{ім'я}, пінгвіни кличуть кататися з гірки!",
    "Відпочинь трішки, {ім'я}, подивись на сніг.",
    "Ау, {ім'я}! Тут сніг іде!",
  ]);

  // Короткі побажання з подарунка (до ~45 символів). Лише тепле й затишне; без імен і політики.
  const WISHES = Object.freeze([
    'Нехай сьогодні буде тепло й тихо.',
    'Хай вимикається лише будильник, а не світло.',
    'Щоб павербанк завжди був заряджений!',
    'Тиха, спокійна ніч тобі.',
    'Нехай усі рідні будуть поруч.',
    'Хай повертаються всі, кого чекають.',
    'Бажаю міцного сну без тривог.',
    'Нехай мир прийде скоріше.',
    'Хай у домі завжди буде світло й тепло.',
    'Бажаю сил — їх у тебе більше, ніж здається.',
    'Хай найближчі новини будуть добрі.',
    'Перемоги й теплої зустрічі з рідними.',
    'Нехай чекання закінчиться обіймами.',
    'Тихої ночі й солодких снів.',
    'Бажаю смачного чаю з печивом.',
    'Нехай мандаринки завжди будуть солодкі!',
    'Тобі теплу ковдру й гарний серіал.',
    'Хай обійми будуть міцні й щирі.',
    'Нехай сьогодні тебе обійме хтось рідний.',
    'Бажаю лагідних котиків на колінах.',
    'Хай какао буде гарячим, а зефірки — пухнастими.',
    'Нехай день почнеться з усмішки.',
    'Бажаю сміху до сліз!',
    'Хай гроші приходять без поспіху й без затримок.',
    'Нехай зарплата буде приємною несподіванкою.',
    'Бажаю зустрічі з давніми друзями.',
    'Нехай найкращі люди будуть поруч.',
    'Хай сьогодні все вдається з першого разу.',
    'Бажаю тобі ідеальної ранкової кави.',
    'Нехай вихідні тягнуться довше.',
    'Бажаю спокою в душі.',
    'Хай інтернет не підводить!',
    'Нехай зарядка в телефоні не закінчується.',
    'Бажаю смачної вечері та доброго настрою.',
    'Хай борщ буде найсмачнішим.',
    'Нехай вареники самі стрибають до тарілки!',
    'Бажаю пухнастого снігу за вікном.',
    'Нехай сніг іде, а в хаті — тепло.',
    'Бажаю затишку, пледа й гарної книжки.',
    'Хай твоя ялинка сяє найяскравіше.',
    'Нехай гірлянда світить усі вечори.',
    'Бажаю чудового настрою на весь день.',
    'Хай тобі трапляються самі добрі люди.',
    'Нехай день буде легкий, як сніжинка.',
    'Бажаю добрих новин зранку.',
    'Хай сьогодні буде привід для радості.',
    'Нехай усі твої бажання збуваються.',
    'Бажаю здоровʼя тобі й близьким.',
    'Хай у твоєму домі пахне пирогом.',
    'Нехай серце буде спокійним.',
    'Бажаю сонячної погоди у твоїй душі.',
    'Хай тобі посміхнеться удача!',
    'Нехай завтра буде ще кращим за сьогодні.',
    'Бажаю тобі вдалих задумів.',
    'Хай робота приносить радість, а не нерви.',
    'Нехай кожен день дарує щось приємне.',
    'Бажаю сил, терпіння й гарного відпочинку.',
    'Хай тебе завжди чекають вдома.',
    'Нехай біля тебе буде хтось, хто підтримає.',
    'Бажаю тихого вечора з близькими.',
    'Хай диво знайде тебе сьогодні.',
    'Нехай тепла вистачить на всіх.',
    'Бажаю лише світлих думок.',
    'Хай твій день буде як свіжий сніг — чистий.',
    'Нехай гарячий чай завжди буде під рукою.',
    'Бажаю доброго сну й гарних сновидінь.',
    'Бажаю все встигати без поспіху.',
    'Нехай хмари розійдуться, а душа розквітне.',
    'Бажаю вдалих покупок за добру ціну.',
    'Нехай усе, що загубилось, знайдеться.',
    'Хай кішка муркоче, а ти відпочиваєш.',
    'Бажаю пʼяти хвилин тиші для себе.',
    'Нехай телефон дзвонить лише з гарними вістями.',
    'Хай тобі не доведеться нікуди бігти зранку.',
    'Бажаю ніжності й доброти навколо.',
    'Нехай твоя усмішка заразить усіх.',
    'Хай сьогодні буде багато приємних дрібниць.',
    'Бажаю простого людського щастя.',
    'Нехай ялинкові іграшки не бʼються.',
    'Хай мандаринова шкірка пахне святом.',
    'Бажаю смачного печива без крихт на клавіатурі!',
    'Нехай будильник сьогодні відпочиває.',
    'Хай добрий настрій тебе наздожене.',
    'Бажаю довгих розмов з тими, кого любиш.',
    'Нехай на душі буде затишно.',
    'Хай світло вмикається вчасно!',
    'Бажаю міцних нервів і залізного терпіння.',
    'Нехай чашка з кавою завжди буде повна.',
    'Хай тобі пишуть лише приємні повідомлення.',
    'Бажаю веселого настрою до вечора.',
    'Нехай кожна зустріч дарує тепло.',
    'Хай справи самі складаються докупи.',
    'Бажаю, щоб день був лагідний до тебе.',
    'Нехай серце знає, що все буде добре.',
    'Нехай ти відчуєш, як тебе люблять.',
    'Бажаю доброго ранку й гарного вечора.',
    'Нехай у кишені завжди знайдеться цукерка.',
    'Хай зима буде лагідною й доброю.',
    'Бажаю радісних звісток від рідних.',
    'Нехай усі, хто далеко, скоро будуть вдома.',
    'Хай світло в твоєму домі не гасне.',
    'Бажаю плюшевих шкарпеток і теплих тапок.',
    'Нехай у холодильнику знайдеться щось смачне.',
    'Хай день пройде без метушні.',
    'Бажаю невеликих, але приємних перемог.',
    'Нехай усе складеться якнайкраще.',
    'Хай твоя доброта повертається втричі.',
    'Бажаю відпочити так, щоб аж виспатись.',
    'Нехай у серці живе тепло.',
    'Хай лунає лише добра музика.',
    'Бажаю мирного ранку й теплого дня.',
    'Нехай у кожному домі буде світло.',
    'Хай ніч буде тиха, а ранок — добрий.',
    'Бажаю не сумувати надовго.',
    'Нехай надія завжди буде з тобою.',
    '{ім\'я}, ти молодець — так і знай!',
    '{ім\'я}, бажаю тобі багато тепла.',
    '{ім\'я}, нехай сьогодні все складеться.',
    '{ім\'я}, ти заслуговуєш на відпочинок.',
    '{ім\'я}, хай день буде ніжним.',
    '{ім\'я}, бережи себе й радій дрібницям.',
    '{ім\'я}, нехай удача завжди поруч.',
  ]);

  // ------------------------------------------------------------------ helpers
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutBack = (t) => { const c = 1.70158; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const easeInOut = (t) => t * t * (3 - 2 * t);

  function plural(n, one, few, many) {
    n = Math.abs(n);
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  }
  function daysUntilNewYear(now) {
    now = now || new Date();
    const ny = new Date(now.getFullYear() + 1, 0, 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((ny - today) / 86400000);
  }
  function daysText(n) {
    if (n == null) n = daysUntilNewYear();
    return n + ' ' + plural(n, 'день', 'дні', 'днів');
  }
  // {ім'я} (будь-який апостроф) і сумісні {имя}; {дні} і {дни}
  const RX_NAME = /\{(?:ім['’ʼ`]?я|имя)\}/gu;
  const RX_DAYS = /\{(?:дні|дни)\}/gu;
  /** Підстановка {ім'я} і {дні}. Якщо імені немає — акуратно прибираємо звертання. */
  function formatPhrase(text, name, now) {
    let s = String(text == null ? '' : text);
    s = s.replace(RX_DAYS, daysText(daysUntilNewYear(now)));
    name = (name || '').trim();
    if (name) return s.replace(RX_NAME, name);
    const N = RX_NAME.source;
    s = s.replace(new RegExp('^\\s*' + N + '\\s*[,!]?\\s*', 'u'), '')
      .replace(new RegExp('\\s*,\\s*' + N + '(?=[\\s.!?,]|$)', 'gu'), '')
      .replace(RX_NAME, '')
      .replace(/\s{2,}/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ------------------------------------------------------------------ голос (лише українська)
  /** Найкращий український голос системи. localOnly — лише локальні (без мережі). Російський як запасний не беремо. */
  function findUkVoice(localOnly) {
    if (typeof speechSynthesis === 'undefined') return null;
    let all = [];
    try { all = speechSynthesis.getVoices() || []; } catch (e) { return null; }
    let best = null, bs = -1;
    for (const v of all) {
      if (!v.lang || !/^uk([-_]|$)/i.test(v.lang)) continue;
      if (localOnly && v.localService === false) continue;
      let sc = 0;
      if (v.localService) sc += 50;
      if (/uk[-_]UA/i.test(v.lang)) sc += 5;
      if (/natural|enhanced|premium|neural/i.test(v.name)) sc += 25;
      if (/lesya|polina|ostap|anatol|natalia|mariya|google/i.test(v.name)) sc += 8;
      if (v.default) sc += 2;
      if (sc > bs) { bs = sc; best = v; }
    }
    return best;
  }
  /** Чи є український голос (за замовчуванням — лише локальний, як у застосунку). Голоси вантажаться асинхронно:
   *  перевіряйте після події speechSynthesis 'voiceschanged'. */
  function hasVoice(opts) { return !!findUkVoice(!(opts && opts.allowRemote)); }
  /** Інформація для хоста (онбординг пояснює, як додати голос). */
  function voiceInfo(opts) {
    const v = findUkVoice(!(opts && opts.allowRemote));
    const supported = typeof speechSynthesis !== 'undefined';
    return v ? { available: true, supported, name: v.name, lang: v.lang, localService: !!v.localService }
      : { available: false, supported, name: null, lang: 'uk-UA', localService: false };
  }

  // Спрайти: [файл, ширина кадру, висота кадру, кадрів, bbox у кадрі (x0,y0,x1,y1, px), «рідний» напрямок погляду (1 — праворуч/анфас)]
  // 3d/* — власні рендери three.js (tools/render3d), решта — Microsoft Fluent Emoji 3D.
  const SPR = {
    snowman: ['snowman.png', 256, 256, 1, 16, 16, 233, 240, 1],
    smBody: ['snowman_body.png', 256, 256, 1, 33, 16, 223, 240, 1],
    smNoHat: ['snowman_nohat.png', 256, 256, 1, 33, 16, 223, 240, 1],
    smArmL: ['snowman_arm_l.png', 256, 256, 1, 33, 16, 223, 240, 1],
    smArmR: ['snowman_arm_r.png', 256, 256, 1, 33, 16, 223, 240, 1],
    smHat: ['snowman_hat.png', 256, 256, 1, 75, 16, 146, 67, 1],
    smCarrot: ['snowman_carrot.png', 256, 256, 1, 122, 86, 163, 99, 1],
    penguin: ['penguin.png', 256, 256, 1, 32, 49, 224, 239, 1],
    deer: ['deer.png', 256, 256, 1, 16, 16, 240, 240, -1],
    santa: ['santa.png', 256, 256, 1, 24, 15, 235, 240, 1],
    sqRun: ['3d/squirrel_run.png', 256, 256, 8, 6, 34, 235, 213, 1],
    sqJump: ['3d/squirrel_jump.png', 256, 256, 6, 6, 34, 235, 213, 1],
    sqSit: ['3d/squirrel_sit.png', 256, 256, 6, 6, 34, 235, 213, 1],
    tangerine: ['3d/tangerine.png', 256, 256, 6, 36, 36, 220, 220, 1],   // 6 кадрів кочення (оберт 60°)
    peeled: ['3d/tangerine_peeled.png', 256, 256, 3, 15, 55, 245, 224, 1], // 3 стадії очищення
    gift: ['3d/gift.png', 128, 128, 3, 13, 12, 115, 122, 1],
    nut: ['3d/nut.png', 128, 128, 1, 18, 12, 108, 115, 1],
    sm0: ['3d/snowmobile_0.png', 512, 256, 4, 104, 22, 422, 252, 1],
    sm1: ['3d/snowmobile_1.png', 512, 256, 4, 104, 22, 382, 241, 1],
    sm2: ['3d/snowmobile_2.png', 512, 256, 4, 104, 22, 382, 241, 1],
    bulbs: ['3d/bulbs.png', 48, 72, 10, 10, 0, 41, 64, 1],
    sleigh: ['3d/sleigh.png', 256, 256, 1, 2, 46, 256, 219, 1],
  };
  const SLEIGH_NECK = [121, 87];     // точка шиї Санти в кадрі sleigh.png (з tools/render3d)
  const SURPRISES = ['gift'];
  const BULB_COLORS = ['#ff3b47', '#ffcc33', '#3fe06a', '#4aa3ff', '#ff6fd0'];
  const FW_COLORS = ['#ff4050', '#ffcc40', '#4dff73', '#4dccff', '#ff73d9', '#b380ff', '#ff9926'];
  const UI_FONT = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif';

  // ===================================================================================
  function createEngine(opts) {
    opts = opts || {};
    const canvas = opts.canvas;
    if (!canvas || !canvas.getContext) throw new Error('Snezhok.createEngine: нужен canvas');
    const mainCtx = canvas.getContext('2d');
    let ctx = mainCtx;               // тимчасово перемикається на кешовані шари
    const DEMO = opts.mode === 'demo';
    let assetsBase = opts.assetsBase == null ? 'assets/' : String(opts.assetsBase);
    if (assetsBase && !/[\/\\]$/.test(assetsBase)) assetsBase += '/';
    const useWebp = opts.imageFormat === 'webp';

    const S = Object.assign({}, DEFAULT_SETTINGS);
    let userName = '', callName = '';
    let phrases = DEFAULT_PHRASES.slice(), customPhrases = false, lastPhrase = -1;
    let wishQueue = [], lastWish = -1;
    let topInset = +opts.topInset || 0, bottomInset = +opts.bottomInset || 0;
    const getWindows = typeof opts.getWindows === 'function' ? opts.getWindows : null;
    const onHover = typeof opts.onInteractiveHover === 'function' ? opts.onInteractiveHover : null;
    const hostSpeak = typeof opts.speak === 'function' ? opts.speak : null;
    const hostEvent = typeof opts.onEvent === 'function' ? opts.onEvent : null;
    const stats = { tangerinesEaten: 0, nutsFed: 0, snowmenKnocked: 0 };

    function emit(name, data) {
      if (!hostEvent) return;
      try { hostEvent(name, data || {}); } catch (e) { /* хост не должен ронять движок */ }
    }
    let warned = {};
    function warnOnce(key, msg) { if (warned[key]) return; warned[key] = 1; try { console.warn('[Снежок] ' + msg); } catch (e) {} }

    // ------------------------------------------------------------------ state
    let W = 0, H = 0, DPR = 1, U = 1;
    let T = 0;                       // время движка (с), идёт только когда не на паузе
    let running = false, destroyed = false, raf = 0, lastTs = 0, lastRender = 0;
    const BIN = 6;
    let drift = new Float32Array(0), driftMax = new Float32Array(0), plowed = new Uint8Array(0), driftPeak = 0;
    let driftSeed1 = rand(0, TAU), driftSeed2 = rand(0, TAU);

    const flakes = [], flakePool = [];
    const parts = [], partPool = [];
    const prints = [];
    const actors = [];               // snowman / penguin / squirrel
    const items = [];                // мандаринки, подарки, орехи…
    const pieces = [];               // части развалившегося снеговика, слетевшая шапка
    const sleighs = [];
    const balls = [];                // снежки
    const rockets = [];
    const bubbles = [];              // короткие реплики «Эй!», «Би-бип!»
    const pops = [];                 // короткі ефекти-спрайти (очищений мандарин)
    const buried = [];               // закопанные белками предметы
    let convoy = null;               // снегоходы
    let greeter = null;              // снеговик-«привет»
    let countdown = null, title = null, fireUntil = -1, nextRocket = 0;
    let filled = false;
    let inited = false;
    let powerSave = false;          // від батареї: ≤ 20 fps, DPR 1, менше сніжинок
    let targetFps = DEMO ? 60 : 30;  // setFrameRate(); в оверлеї 30 (V2-01)
    let frameMs = 0;                 // середній час кроку+малювання, мс

    const mouse = { x: -1e4, y: -1e4, on: false, vx: 0, vy: 0, speed: 0, lx: 0, ly: 0, lt: 0, moved: false };
    let lastInputAt = 0;             // performance.now() последнего ввода (для тишины снегоходов при простое)
    let hovered = null, hoverState = false, cursorOwner = null;
    let gestured = false;

    // таймеры появления
    const timers = {
      snowman: DEMO ? rand(3, 6) : rand(8, 20),
      penguin: DEMO ? rand(8, 14) : rand(25, 50),
      squirrel: DEMO ? rand(5, 10) : rand(30, 60),
      sleigh: DEMO ? rand(40, 70) : rand(300, 600),
      gift: DEMO ? rand(20, 40) : rand(180, 300),
      fight: DEMO ? rand(20, 40) : rand(90, 180),   // лічиться лише поки на екрані ≥ 2 персонажі
    };
    let calmNextAt = 0;
    let plowAlive = 0;               // живі частинки фонтану з-під плуга              // спокійний режим: наступна поява персонажа не раніше
    let snowmobileRef = 0;           // T, от которого считается интервал
    let snowmobilePending = false;

    // ------------------------------------------------------------------ settings / user
    function applySettings(p) {
      if (!p || typeof p !== 'object') return;
      const prevEvery = S.snowmobileEvery;
      for (const k in p) {
        if (!(k in DEFAULT_SETTINGS)) { S[k] = p[k]; continue; }
        const d = DEFAULT_SETTINGS[k], v = p[k];
        if (typeof d === 'boolean') S[k] = !!v;
        else if (typeof d === 'number') { const n = +v; if (isFinite(n)) S[k] = n; }
        else S[k] = v;
      }
      S.intensity = clamp(Math.round(S.intensity), 0, 2);
      S.wind = clamp(Math.round(S.wind), 0, 2);
      S.snowmobileEvery = S.snowmobileEvery >= 45 ? 60 : 30;
      S.idleMinutes = clamp(Math.round(S.idleMinutes), 1, 60);
      if (prevEvery !== S.snowmobileEvery) { /* интервал сменили — отсчёт от последнего проезда сохраняется */ }
      if (!inited) return; // до конца инициализации побочных эффектов нет (caps/audio ещё не объявлены)
      if (!S.windowCaps) { caps.clear(); ice.clear(); }
      if (!S.icicles) ice.clear();
      if (!S.iconCaps) for (const [id, c] of caps) if (c.icon) caps.delete(id);
      if (!S.sounds) humStop(true);
    }
    function setUser(u) {
      if (!u || typeof u !== 'object') return;
      if (u.userName != null) userName = String(u.userName).trim();
      if (u.callName != null) callName = String(u.callName).trim();
    }
    function nameForSpeech() { return callName || userName || ''; }
    function setPhrases(arr) {
      const list = Array.isArray(arr) ? arr.map((s) => String(s == null ? '' : s).trim()).filter(Boolean) : [];
      if (list.length) { phrases = list; customPhrases = true; } else { phrases = DEFAULT_PHRASES.slice(); customPhrases = false; }
      lastPhrase = -1;
    }
    const RX_MAIN = /що\s+будемо\s+робити|что\s+будем\s+делать/i;
    function randomPhrase() {
      const n = phrases.length;
      if (!n) return '';
      const main = [], other = [];
      for (let i = 0; i < n; i++) (RX_MAIN.test(phrases[i]) ? main : other).push(i);
      let i;
      if (main.length && other.length) {
        // головна фраза ≈ 45 %: після неї — завжди інша; після іншої — головна з імовірністю 0,8
        if (main.indexOf(lastPhrase) >= 0 || Math.random() >= 0.8) {
          const pool = other.length > 1 ? other.filter((k) => k !== lastPhrase) : other;
          i = pick(pool);
        } else i = pick(main.length > 1 ? main.filter((k) => k !== lastPhrase) : main);
      } else {
        i = (Math.random() * n) | 0;
        if (n > 1 && i === lastPhrase) i = (i + 1 + ((Math.random() * (n - 1)) | 0)) % n;
      }
      lastPhrase = i;
      return phrases[i];
    }
    function setStats(st) {
      if (!st || typeof st !== 'object') return;
      let changed = false;
      for (const k of ['tangerinesEaten', 'nutsFed', 'snowmenKnocked']) {
        if (st[k] != null && isFinite(+st[k]) && +st[k] !== stats[k]) { stats[k] = +st[k]; changed = true; }
      }
      if (changed) emit('statsChanged', Object.assign({}, stats));
    }

    applySettings(opts.settings);
    setUser({ userName: opts.userName || '', callName: opts.callName || '' });
    if (opts.phrases !== undefined) setPhrases(opts.phrases);

    // ------------------------------------------------------------------ sprites
    const IMG = {};
    let spritesLoaded = 0;
    for (const name in SPR) {
      const d = SPR[name];
      const fw = d[1], fh = d[2], nf = d[3];
      const rec = {
        name, img: null, fr: null, ok: false, failed: false, nat: d[8], fw, fh, nf, aspect: fw / fh,
        cx: (d[4] + d[6]) / 2 / fw, by: d[7] / fh, ty: d[5] / fh,
        cw: (d[6] - d[4]) / fh, ch: (d[7] - d[5]) / fh, bb: d.slice(4, 8),
      };
      IMG[name] = rec;
      if (typeof Image === 'undefined') continue;
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        // спрайтшит → окремі кадри
        if (nf > 1) {
          rec.fr = [];
          for (let i = 0; i < nf; i++) { const c = makeCanvas(fw, fh); c.getContext('2d').drawImage(im, i * fw, 0, fw, fh, 0, 0, fw, fh); rec.fr.push(c); }
        } else rec.fr = [im];
        rec.ok = true; rec.img = im; spritesLoaded++;
      };
      let triedPng = !useWebp;
      im.onerror = () => {
        if (!triedPng) { triedPng = true; im.src = assetsBase + d[0]; return; }
        rec.failed = true; warnOnce('img' + name, 'не завантажився спрайт ' + d[0] + ' — персонажа приховано');
      };
      im.src = assetsBase + (useWebp ? d[0].replace(/\.png$/, '.webp') : d[0]);
    }
    const ok = (n) => IMG[n] && IMG[n].ok;

    const cache = new Map();
    function makeCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
      return c;
    }
    /** Предрендер спрайта под нужный размер (с пошаговым уменьшением для чёткости) и зеркальная копия. */
    /** Пререндер кадру fi під висоту size (CSS px) з покроковим зменшенням для чіткості; mirror — дзеркальна копія. */
    function scaled(name, size, mirror, fi) {
      const rec = IMG[name];
      if (!rec || !rec.ok) return null;
      fi = (fi | 0) % rec.nf;
      const ph = Math.max(8, Math.ceil((size * DPR) / 4) * 4), pw = Math.max(4, Math.round(ph * rec.aspect));
      const key = name + '|' + fi + '|' + ph + (mirror ? 'm' : '');
      let c = cache.get(key);
      if (c) return c;
      if (cache.size > 500) cache.clear();
      let src = rec.fr[fi], sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
      while (sw / 2 >= pw * 1.5) {
        const half = makeCanvas(sw / 2, sh / 2), hg = half.getContext('2d');
        hg.imageSmoothingQuality = 'high';
        hg.drawImage(src, 0, 0, sw / 2, sh / 2);
        src = half; sw = sw / 2; sh = sh / 2;
      }
      c = makeCanvas(pw, ph);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      if (mirror) { g.translate(pw, 0); g.scale(-1, 1); }
      g.drawImage(src, 0, 0, pw, ph);
      cache.set(key, c);
      return c;
    }
    /** Малює кадр спрайта висотою size так, що «ноги» (низ bbox по центру) у (0,0). sx<0 — дзеркально. */
    function drawFrame(name, size, sx, sy, alpha, anchorName, fi) {
      const rec = IMG[name];
      if (!rec || !rec.ok) return false;
      const a = IMG[anchorName || name];
      const mirror = sx < 0;
      const c = scaled(name, size, mirror, fi);
      if (!c) return false;
      const asx = Math.abs(sx);
      const cx = mirror ? 1 - a.cx : a.cx;
      const w = size * rec.aspect;
      if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
      ctx.drawImage(c, -cx * w * asx, -a.by * size * sy, w * asx, size * sy);
      if (alpha !== undefined && alpha < 1) ctx.globalAlpha = 1;
      return true;
    }

    // процедурные спрайты
    function radialSprite(size, stops) {
      const c = makeCanvas(size, size), g = c.getContext('2d');
      const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (const [o, col] of stops) gr.addColorStop(o, col);
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
      return c;
    }
    let dotImg, shadowImg, glowImgs, snowballImg, warmGlow, puffImg;
    function buildProcedural() {
      if (typeof document === 'undefined') return;
      dotImg = radialSprite(32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.95)'], [0.7, 'rgba(205,222,255,.5)'], [1, 'rgba(180,205,255,0)']]);
      shadowImg = radialSprite(64, [[0, 'rgba(30,45,85,.55)'], [0.55, 'rgba(30,45,85,.3)'], [1, 'rgba(30,45,85,0)']]);
      puffImg = radialSprite(64, [[0, 'rgba(255,255,255,.9)'], [0.5, 'rgba(240,246,255,.55)'], [1, 'rgba(230,240,255,0)']]);
      warmGlow = radialSprite(128, [[0, 'rgba(255,250,220,.95)'], [0.25, 'rgba(255,236,170,.55)'], [1, 'rgba(255,220,120,0)']]);
      glowImgs = BULB_COLORS.map((c) => radialSprite(64, [[0, c], [0.35, c + '88'], [1, 'rgba(0,0,0,0)']]));
      // кристаллическая снежинка
      // снежок
      snowballImg = makeCanvas(64, 64);
      {
        const g = snowballImg.getContext('2d');
        const gr = g.createRadialGradient(24, 22, 3, 32, 32, 30);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#eef3fb'); gr.addColorStop(1, '#b9c7e6');
        g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 29, 0, TAU); g.fill();
        g.fillStyle = 'rgba(160,180,220,.35)';
        for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(rand(16, 48), rand(18, 50), rand(1.5, 3.5), 0, TAU); g.fill(); }
      }
    }
    buildProcedural();

    /** Снежный ком для развалившегося снеговика (Fluent-подобная мягкая заливка). */
    const ballCache = new Map();
    function snowBall(r) {
      const px = Math.ceil(r * 2 * DPR) + 4;
      const key = px;
      let c = ballCache.get(key);
      if (c) return c;
      c = makeCanvas(px, px);
      const g = c.getContext('2d'), R = px / 2 - 2;
      const gr = g.createRadialGradient(px * 0.4, px * 0.33, R * 0.1, px / 2, px / 2, R);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#f1eef6'); gr.addColorStop(0.85, '#d9cfe8'); gr.addColorStop(1, '#bba9d6');
      g.fillStyle = gr; g.beginPath(); g.arc(px / 2, px / 2, R, 0, TAU); g.fill();
      ballCache.set(key, c);
      return c;
    }

    // ------------------------------------------------------------------ snowmobile (процедурная отрисовка)
    // снігохід: 3D-рендери sm0 (з плугом), sm1, sm2 — висота кадру на екрані
    function smSize() { return 128 * U; }
    function smLen() { const r = IMG.sm1; return r && r.ok ? r.cw * smSize() : 165 * U; }
    /** Відстань від центру снігохода до переднього краю (плуга) у CSS px. */
    function smFront(v) { const r = IMG['sm' + v.ci]; if (!r) return smLen() / 2; return ((r.bb[2] - r.cx * r.fw) / r.fh) * smSize(); }

    // ------------------------------------------------------------------ resize / DPR
    let ro = null;
    function measure() {
      const w = canvas.clientWidth || (canvas.getBoundingClientRect && canvas.getBoundingClientRect().width) || 0;
      const h = canvas.clientHeight || (canvas.getBoundingClientRect && canvas.getBoundingClientRect().height) || 0;
      return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
    }
    /** DPR обмежено: ≤ 1.5, в енергозбереженні 1 (менше пікселів для GPU-композитингу). */
    function dprCap() { const d = (typeof window !== 'undefined' && window.devicePixelRatio) || 1; return powerSave ? 1 : Math.min(d, 1.5); }
    function resize() {
      const [w, h] = measure();
      const dpr = dprCap();
      if (w === W && h === H && dpr === DPR) return;
      const oldU = U, oldDpr = DPR;
      W = w; H = h; DPR = dpr;
      // масштаб персонажей: по высоте, но и по ширине (на телефоне снеговик и облачко поменьше)
      U = clamp(Math.min(H / 950, W / 640), 0.5, 1.25);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      if (oldU !== U || oldDpr !== DPR) { cache.clear(); ballCache.clear(); }
      resizeDrift();
    }
    function resizeDrift() {
      const n = Math.floor(W / BIN) + 2;
      const old = drift;
      drift = new Float32Array(n);
      driftMax = new Float32Array(n);
      plowed = new Uint8Array(n);
      const lim = H * 0.12;
      const k2 = clamp(H / 900, 0.55, 1.4);
      for (let k = 0; k < n; k++) {
        const x = k * BIN;
        const m = (40 + 22 * Math.sin(x / 170 + driftSeed1) + 9 * Math.sin(x / 53 + driftSeed2)) * k2;
        driftMax[k] = Math.min(lim, Math.max(10, m));
        if (k < old.length) drift[k] = Math.min(driftMax[k], old[k]);
      }
    }
    function baseY() { return H - bottomInset; }
    function driftH(x) {
      const n = drift.length;
      if (!n) return 0;
      const fx = clamp(x / BIN, 0, n - 1);
      const k = fx | 0, k2 = k + 1 < n ? k + 1 : k, a = fx - k;
      return drift[k] * (1 - a) + drift[k2] * a;
    }
    function groundY(x) { return baseY() - driftH(x); }
    function addDrift(k, a) { if (k >= 0 && k < drift.length) drift[k] = clamp(drift[k] + a, 0, driftMax[k]); }
    function depositDrift(x, a) {
      const k = Math.floor(x / BIN);
      addDrift(k, a * 0.4); addDrift(k - 1, a * 0.2); addDrift(k + 1, a * 0.2); addDrift(k - 2, a * 0.1); addDrift(k + 2, a * 0.1);
    }
    function dentDrift(x, amount, width) {
      const k0 = Math.floor((x - width) / BIN), k1 = Math.floor((x + width) / BIN);
      for (let k = k0; k <= k1; k++) if (k >= 0 && k < drift.length && drift[k] > 3) drift[k] = Math.max(3, drift[k] - amount);
    }

    // ------------------------------------------------------------------ windows & caps
    const CAP_MAX = 14;
    const caps = new Map();          // id -> {depth: Float32Array, w}
    let wins = [];
    const winById = new Map();
    const prevWin = new Map();       // id -> {x,y,w,h,t}
    /** Найбільша висота шапки: на значку (kind:'icon') — маленька, ≈ 13 % ширини і не вище 6,5 px. */
    function capMax(cap) {
      const m = CAP_MAX * Math.max(0.7, U);
      return cap && cap.icon ? Math.min(6.5 * Math.max(0.7, U), cap.depth.length * BIN * 0.13, m) : m;
    }
    function capLimit(n, k, cap) {
      const edge = Math.min(k, n - 1 - k) + 0.5;
      return Math.min(capMax(cap), edge * BIN * 0.6);
    }
    function newCapArr(width) { return new Float32Array(Math.max(1, Math.floor(width / BIN))); }
    /** Чи можуть персонажі й предмети стояти на цьому прямокутнику (на значки — ні). */
    function perch(w) { return w.landable && !w.icon; }
    function syncWindows(dt) {
      let list = null;
      if (getWindows) {
        try { list = getWindows(); } catch (e) { warnOnce('win', 'getWindows() впав — сніг на вікнах вимкнено'); list = null; }
      }
      if (!Array.isArray(list)) list = [];
      const next = [];
      winById.clear();
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (!r) continue;
        const x = +r.x, y = +r.y, w = +r.w, h = +r.h;
        if (!isFinite(x) || !isFinite(y) || !(w > 0) || !(h > 0)) continue;
        const id = r.id != null ? String(r.id) : 'w' + i;
        // значки робочого столу (kind:'icon') ідуть у кінці списку: маленька шапка від 24 px, без персонажів і бурульок
        const icon = r.kind === 'icon';
        const landable = icon
          ? !!S.iconCaps && w >= 24 && y > topInset + 6 && y < H - 30 && x < W && x + w > 0
          : w >= 60 && y > topInset + 6 && y < H - 60 && x < W && x + w > 0;
        const win = { id, x, y, w, h, r: x + w, b: y + h, idx: next.length, icon, landable };
        next.push(win);
        winById.set(id, win);
      }
      wins = next;
      // прокрутка страницы (лендинг): все известные окна сдвинулись на один и тот же dy без dx — это не встряска
      let scrollDy = null;
      for (const win of wins) {
        const p = prevWin.get(win.id);
        if (!p) continue;
        const dy = win.y - p.y;
        if (win.x !== p.x || win.w !== p.w || win.h !== p.h || !dy || (scrollDy !== null && Math.abs(dy - scrollDy) > 0.5)) { scrollDy = null; break; }
        scrollDy = dy;
      }
      if (scrollDy) {
        for (const win of wins) { const p = prevWin.get(win.id); if (p) { p.y = win.y; p.t = T; } }
        moveRiders(null, 0, scrollDy, false, true);
      }
      // перемещения, встряхивания, закрытие
      for (const win of wins) {
        const p = prevWin.get(win.id);
        if (!p) { prevWin.set(win.id, { x: win.x, y: win.y, w: win.w, h: win.h, t: T }); continue; }
        const dx = win.x - p.x, dy = win.y - p.y, dw = win.w - p.w;
        if (dx || dy || dw || win.h !== p.h) {
          const dist = Math.hypot(dx, dy);
          const interval = clamp(T - p.t, 1 / 120, 0.5);
          const speed = dist / interval;
          const cap = caps.get(win.id);
          const shaken = speed > 380 || Math.abs(dy) > 60;
          if (cap && (shaken || !win.landable)) { shedCap(win, cap, p); caps.delete(win.id); }
          else if (cap && dw) {
            const arr = newCapArr(win.w), old = cap.depth;
            for (let k = 0; k < arr.length; k++) arr[k] = Math.min(capLimit(arr.length, k), old[Math.min(old.length - 1, Math.floor((k * old.length) / arr.length))] || 0);
            cap.depth = arr;
          }
          // те, кто стоит на окне, едут вместе с ним (или падают при встряске)
          moveRiders(win.id, dx, dy, shaken);
          p.x = win.x; p.y = win.y; p.w = win.w; p.h = win.h; p.t = T;
        }
      }
      for (const [id, p] of prevWin) {
        if (!winById.has(id)) {
          prevWin.delete(id);
          const cap = caps.get(id);
          if (cap) { puffCap(p, cap); caps.delete(id); }
          dropRiders(id);
        }
      }
      if (S.windowCaps) {
        for (const win of wins) if (win.landable && !caps.has(win.id)) caps.set(win.id, { depth: newCapArr(win.w) });
      }
    }
    function occluded(x, y, before) {
      for (let j = 0; j < before; j++) {
        const r = wins[j];
        if (x >= r.x && x <= r.r && y >= r.y && y <= r.b) return true;
      }
      return false;
    }
    function capDepthAt(win, x) {
      const cap = caps.get(win.id);
      if (!cap) return 0;
      const k = Math.floor((x - win.x) / BIN);
      return k >= 0 && k < cap.depth.length ? cap.depth[k] : 0;
    }
    function winTop(win, x) { return win.y - capDepthAt(win, x) * 0.85; }
    function winVisibleAt(win, x) { return win.landable && x > win.x + 2 && x < win.r - 2 && !occluded(x, win.y - 1, win.idx); }
    function shedCap(win, cap, p) {
      let n = 0;
      const left = p ? p.x : win.x, top = p ? p.y : win.y;
      for (let k = 0; k < cap.depth.length; k++) {
        const d = cap.depth[k];
        if (d <= 1.2) continue;
        const cnt = Math.floor(d / 4) + 1;
        for (let i = 0; i < cnt && n < 90; i++, n++) spawnChunk(left + (k + Math.random()) * BIN, top - Math.random() * d);
      }
      if (n > 0) emit('capShaken', { id: win.id });
    }
    function puffCap(p, cap) {
      for (let k = 0; k < cap.depth.length; k += 3) {
        if (cap.depth[k] < 2) continue;
        part(p.x + k * BIN, p.y - cap.depth[k] / 2, rand(-20, 20), rand(-30, 0), rand(0.4, 0.8), rand(3, 6), null, 3, 0, 1.5);
      }
    }
    function moveRiders(id, dx, dy, shaken, all) {
      const move = (e) => {
        if (all ? !e.onWin : e.onWin !== id) return;
        if (shaken) { e.onWin = null; e.air = true; e.vy = -rand(60, 160); e.vx = rand(-60, 60); if (e.kind === 'squirrel') e.state = 'fall'; }
        else { e.x += dx; e.y += dy; }
      };
      actors.forEach(move); items.forEach(move);
    }
    function dropRiders(id) {
      const drop = (e) => { if (e.onWin === id) { e.onWin = null; e.air = true; e.vy = 0; if (e.kind === 'squirrel') e.state = 'fall'; } };
      actors.forEach(drop); items.forEach(drop);
    }
    /** Поверхность под точкой: окно (видимый верх) или сугроб. */
    function surfaceBelow(x, y, allowWin) {
      let best = groundY(x), bw = null;
      if (allowWin) {
        for (const win of wins) {
          if (!win.landable || x <= win.x + 2 || x >= win.r - 2) continue;
          const top = winTop(win, x);
          if (top >= y - 1 && top < best && !occluded(x, win.y - 1, win.idx)) { best = top; bw = win; }
        }
      }
      return { y: best, win: bw };
    }

    // ------------------------------------------------------------------ particles
    // type: 0 — искра (аддитивно), 1 — снежинка-брызги, 2 — цветной кусочек (кожура/крошка), 3 — облачко
    function part(x, y, vx, vy, life, size, color, type, g, drag) {
      if (parts.length > 2600) return null;
      const p = partPool.pop() || {};
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life; p.size = size;
      p.color = color; p.type = type; p.g = g; p.drag = drag || 0; p.plow = 0; p.rot = rand(0, TAU); p.spin = rand(-8, 8);
      parts.push(p);
      return p;
    }
    function sparkle(x, y, color, n, spd, life) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = rand(spd * 0.55, spd * 1.3);
        part(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.7, 1) * (life || 1.8), rand(1.6, 3.4), color, 0, 120, 0.9);
      }
    }
    function snowSpray(x, y, dirx, n, power) {
      for (let i = 0; i < n; i++) {
        part(x + rand(-4, 4), y + rand(-3, 2), dirx * rand(0.3, 1) * power + rand(-30, 30), -rand(0.4, 1) * power,
          rand(0.5, 1.1), rand(1.4, 3.6) * Math.max(0.8, U), null, 1, 700, 0.6);
      }
    }
    function crumbs(x, y, colors, n) {
      for (let i = 0; i < n; i++) part(x, y, rand(-50, 50), rand(-90, -20), rand(0.5, 0.9), rand(1.5, 3), pick(colors), 2, 500, 0.5);
    }

    // ------------------------------------------------------------------ flakes
    function spawnFlake(randomY) {
      const f = flakePool.pop() || {};
      const d = Math.random();
      f.k = 0; f.d = d; f.r = 1.1 + d * d * 4.0;
      f.crystal = false; // кришталеві сніжинки прибрано (CR-3): лише м'які пластівці
      f.base = 22 + d * 60 + rand(-6, 6);
      f.x = rand(-20, W + 20); f.y = randomY ? rand(-10, H) : rand(-30, -6);
      f.vx = 0; f.vy = f.base; f.sway = rand(6, 22); f.freq = rand(0.6, 1.6); f.ph = rand(0, TAU);
      f.spin = 0; f.rot = 0; f.canLand = d < 0.62; f.alpha = 0.45 + 0.55 * d;
      f.si = clamp(Math.round((f.r - 1.1) / 0.4), 0, FL_SIZES - 1); f.ai = clamp(Math.round((f.alpha - 0.45) / 0.55 * (FL_ALPHAS - 1)), 0, FL_ALPHAS - 1);
      flakes.push(f);
    }
    function spawnChunk(x, y) {
      if (flakes.length > 1400) return;
      const f = flakePool.pop() || {};
      f.k = 1; f.d = 0.5; f.r = rand(2, 4.5) * Math.max(0.8, U); f.crystal = false; f.base = rand(220, 320);
      f.si = clamp(Math.round((f.r - 1.1) / 0.4), 0, FL_SIZES - 1); f.ai = FL_ALPHAS - 1;
      f.x = x; f.y = y; f.vx = rand(-45, 45); f.vy = rand(-70, 0); f.sway = 0; f.freq = 1; f.ph = 0; f.spin = 0; f.rot = 0;
      f.canLand = false; f.alpha = 1;
      flakes.push(f);
    }
    function removeFlake(i) { const f = flakes[i]; flakes[i] = flakes[flakes.length - 1]; flakes.pop(); flakePool.push(f); }
    function currentWind() {
      const base = [0, 18, 55][S.wind];
      let w = base * (0.65 + 0.35 * Math.sin(T * 0.17)) + base * 0.4 * Math.sin(T * 0.61 + 1);
      if (S.wind === 2) w += 45 * Math.max(0, Math.sin(T * 0.23)) ** 6; // порывы вьюги
      return w;
    }

    // ------------------------------------------------------------------ prints (следы)
    // k: 0 лапки пингвина (пара), 1 белка (мелкие пары), 2 борозда снеговика, 3 колея снегохода, 4 «живот» пингвина
    function addPrint(x, k, side) {
      if (!S.drifts || driftH(x) < 2.5) return;
      if (prints.length > 520) prints.splice(0, 40);
      prints.push({ x, k, side: side || 0, age: 0, life: rand(20, 30), gh: driftH(x) });
    }

    // ------------------------------------------------------------------ actors (общая часть)
    function count(kind) { let n = 0; for (const a of actors) if (a.kind === kind && !a.dead) n++; return n; }
    function adults(kind) { let n = 0; for (const a of actors) if (a.kind === kind && !a.dead && !a.chick) n++; return n; }
    /** Спокійний режим: одночасно лише один персонаж. */
    function calmBusy() { return !!S.calm && actors.some((a) => !a.dead && !a.chick); }
    function newActor(kind, size, extra) {
      const a = {
        kind, size, x: 0, y: 0, vx: 0, vy: 0, dir: 1, face: 1, air: false, onWin: null, hop: 0, hp: 0,
        sq: 0, sqV: 0, rot: 0, tilt: 0, alpha: 1, state: 'walk', st: 0, t: 0, dead: false, fade: false,
        hb: { x0: 0, y0: 0, x1: 0, y1: 0, on: false },
      };
      return Object.assign(a, extra);
    }
    function squash(e, amt) { e.sq = amt; e.sqV = 0; }
    function updateSpring(e, dt) {
      // пружина squash & stretch
      e.sqV += (-170 * e.sq - 13 * e.sqV) * dt;
      e.sq += e.sqV * dt;
      if (Math.abs(e.sq) < 0.0005 && Math.abs(e.sqV) < 0.01) { e.sq = 0; e.sqV = 0; }
      // плавный разворот: scaleX проходит через ~0 за ~0.22 с
      const target = e.dir >= 0 ? 1 : -1;
      if (e.face !== target) {
        const s = Math.sign(target - e.face) * dt * 9;
        e.face = Math.abs(target - e.face) <= Math.abs(s) ? target : e.face + s;
      }
    }
    function faceScale(e) {
      // при развороте не даём спрайту схлопнуться в ноль
      const f = e.face;
      const m = Math.max(0.18, Math.abs(f));
      return (f < 0 ? -m : m);
    }
    /** Универсальная отрисовка спрайта персонажа: тень, squash/stretch, наклон, разворот, хитбокс. */
    function drawActorSprite(e, name, surfY, opt) {
      const rec = IMG[name];
      if (!rec || !rec.ok) { e.hb.on = false; return; }
      const size = e.size;
      const sx = (1 + e.sq) * (opt && opt.sx || 1), sy = (1 - e.sq) * (opt && opt.sy || 1);
      const fs = faceScale(e) * rec.nat;
      const lift = e.lift || 0;               // высота над поверхностью (прыжок)
      const cw = rec.cw * size * sx, ch = rec.ch * size * sy;
      const rot = e.rot + e.tilt;
      const ar = Math.abs(Math.sin(rot)), ac = Math.abs(Math.cos(rot));
      const halfV = 0.5 * (ch * ac + cw * ar) * (1 - 0.12 * ar);
      const cy = surfY - lift - halfV + (e.sink || 0);
      // тень
      const sh = 1 - clamp(lift / (160 * U), 0, 0.75);
      const shW = (cw * ac + ch * ar) * 0.78 * (0.55 + 0.45 * sh);
      ctx.globalAlpha = 0.85 * sh * e.alpha;
      ctx.drawImage(shadowImg, e.x - shW / 2, surfY - shW * 0.11 + 1, shW, shW * 0.22);
      ctx.globalAlpha = 1;
      // спрайт: поворот вокруг центра
      ctx.save();
      ctx.translate(e.x, cy);
      if (rot) ctx.rotate(rot);
      ctx.translate(0, ch / 2);
      ctx.globalAlpha = e.alpha;
      if (opt && opt.custom) opt.custom(fs, sx, sy);
      else drawFrame(name, size, fs * sx, sy, undefined, undefined, e.fi || 0);
      ctx.globalAlpha = 1;
      ctx.restore();
      // хитбокс (AABB повернутого прямоугольника + 6 px)
      const hw = 0.5 * (cw * ac + ch * ar) * Math.max(0.2, Math.abs(faceScale(e))) + 6;
      e.hb.x0 = e.x - hw; e.hb.x1 = e.x + hw;
      e.hb.y0 = cy - halfV - 6; e.hb.y1 = cy + halfV + 6;
      e.hb.on = true;
      e.cy = cy;
    }
    function surfaceOf(e) {
      if (e.onWin) {
        const win = winById.get(e.onWin);
        if (win && win.landable && e.x > win.x - 4 && e.x < win.r + 4) return winTop(win, e.x);
        e.onWin = null; e.air = true; e.vy = e.vy || 0;
        return null;
      }
      return groundY(e.x);
    }
    /** Падение/прыжок с приземлением на окно (если можно) или сугроб. Возвращает true при приземлении. */
    function airStep(e, dt, allowWin, g) {
      const py = e.y;
      e.vy += (g || 1500) * dt;
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.vy <= 0) return false;
      if (allowWin) {
        for (const win of wins) {
          if (!win.landable || e.x <= win.x + 4 || e.x >= win.r - 4) continue;
          if (e.targetWin && e.targetWin !== win.id) continue;
          const top = winTop(win, e.x);
          if (py <= top + 1 && e.y >= top && !occluded(e.x, win.y - 1, win.idx)) {
            e.y = top; e.onWin = win.id; e.air = false; e.targetWin = null; return true;
          }
        }
      }
      const gy = groundY(e.x);
      if (e.y >= gy) { e.y = gy; e.onWin = null; e.air = false; e.targetWin = null; return true; }
      return false;
    }
    function nearestEdgeDir(x) { return x < W / 2 ? -1 : 1; }
    function offscreen(e, m) { return e.x < -m || e.x > W + m; }

    // ------------------------------------------------------------------ SNOWMAN
    function spawnSnowman() {
      if (!ok('smBody') || count('snowman') >= 1) return null;
      // второй снеговик заходит с другой стороны, чтобы не слипаться с первым
      const other = actors.find((a) => a.kind === 'snowman' && !a.dead);
      const dir = other ? (other.x < W / 2 ? -1 : 1) : Math.random() < 0.5 ? 1 : -1;
      const e = newActor('snowman', 96 * U * rand(0.92, 1.06), {
        dir, face: dir, speed: rand(30, 44) * U, ph: rand(0, TAU), waveAt: rand(0.25, 0.75) * W, waved: Math.random() < 0.12,
        arm: 0, armT: 0, noHat: false, hatBack: 0, furrowX: 0,
      });
      e.x = dir > 0 ? -60 * U : W + 60 * U;
      e.y = groundY(e.x); e.furrowX = e.x;
      actors.push(e);
      return e;
    }
    function updateSnowman(e, dt) {
      e.t += dt; e.st += dt;
      const hov = hovered === e;
      if (e.state === 'walk' || e.state === 'flee') {
        const fleeing = e.state === 'flee';
        const sp = fleeing ? e.fleeSpeed : e.speed;
        const prevPh = e.ph;
        e.ph += dt * (fleeing ? 14 : 7.5);
        // движение подскоками: быстрее в фазе полёта
        const k = 0.45 + 0.9 * Math.abs(Math.sin(e.ph));
        e.x += e.dir * sp * k * dt;
        e.lift = Math.abs(Math.sin(e.ph)) * (fleeing ? 9 : 4.5) * U;
        e.tilt = Math.sin(e.ph) * 0.025;
        if (Math.floor(prevPh / Math.PI) !== Math.floor(e.ph / Math.PI)) { squash(e, 0.09); if (Math.random() < 0.5) snowSpray(e.x, groundY(e.x), -e.dir, 2, 50); }
        if (Math.abs(e.x - e.furrowX) > 5) { addPrint(e.x, 2); dentDrift(e.x, 0.25, 8); e.furrowX = e.x; }
        if (!fleeing && !e.waved && ((e.dir > 0 && e.x > e.waveAt) || (e.dir < 0 && e.x < e.waveAt))) { e.waved = true; startWave(e, rand(1.4, 2.2)); }
        if (!fleeing && hov) startWave(e, 0.9);
        if (offscreen(e, 90 * U) && ((e.dir > 0 && e.x > W) || (e.dir < 0 && e.x < 0))) e.dead = true;
      } else if (e.state === 'wave') {
        e.lift = Math.max(0, (e.lift || 0) - dt * 40);
        e.tilt *= 0.9;
        if (mouse.on) e.dir = mouse.x >= e.x ? 1 : -1;
        e.arm = Math.sin(e.st * 11) * 0.55 + 0.75;
        if (hov) e.waveEnd = Math.max(e.waveEnd, e.st + 0.6);
        if (e.st > e.waveEnd) { e.state = 'walk'; e.st = 0; e.dir = e.walkDir; e.arm = 0; }
      } else if (e.state === 'broken') {
        e.lift = 0;
        if (e.st > 0.7 && !e.assembling) { e.assembling = true; for (const p of pieces) if (p.owner === e) p.ret = 0.0001; }
        if (e.assembling && e.st > 1.35) {
          for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].owner === e && !pieces[i].hatOnly) pieces.splice(i, 1);
          e.state = 'walk'; e.st = 0; e.assembling = false; e.dir = e.walkDir; squash(e, 0.2);
          say(e, 'Гей!');
          snowSpray(e.x, groundY(e.x), 0, 8, 120);
        }
      }
      if (e.noHat && e.hatBack > 0 && T > e.hatBack) e.hatBack = 0;
      e.y = groundY(e.x);
      updateSpring(e, dt);
    }
    function startWave(e, dur) {
      if (e.state !== 'wave') e.walkDir = e.dir;
      e.state = 'wave'; e.st = 0; e.waveEnd = dur;
    }
    function clickSnowman(e) {
      if (e.state === 'broken') return;
      if (e.state !== 'wave') e.walkDir = e.dir;
      e.state = 'broken'; e.st = 0; e.assembling = false;
      breakSnowman(e);
      stats.snowmenKnocked++;
      emit('snowmanKnocked', { count: stats.snowmenKnocked });
      sfx('thud');
    }
    function snowmanGeom(e) {
      const s = e.size;
      // шары: низ, середина, голова (позиции относительно ног, в долях размера кадра)
      return [
        { r: 0.30 * s, dy: -0.30 * s, dx: 0 },
        { r: 0.215 * s, dy: -0.70 * s, dx: 0 },
        { r: 0.165 * s, dy: -1.02 * s, dx: 0 },
      ];
    }
    function breakSnowman(e) {
      const gy = groundY(e.x);
      const geo = snowmanGeom(e);
      geo.forEach((b, i) => {
        pieces.push({ owner: e, type: 'ball', r: b.r, x: e.x, y: gy + b.dy, homeDx: b.dx, homeDy: b.dy, vx: rand(-1, 1) * 140 + (i - 1) * 60, vy: -rand(120, 260) * (i + 1) * 0.5, rot: 0, spin: rand(-4, 4), ret: 0, eyes: i === 2 });
      });
      pieces.push({ owner: e, type: 'img', name: 'smHat', x: e.x, y: gy - 1.2 * e.size, homeDx: 0, homeDy: -1.22 * e.size, vx: rand(-120, 120), vy: -rand(300, 420), rot: 0, spin: rand(-9, 9), ret: 0, size: e.size });
      pieces.push({ owner: e, type: 'img', name: 'smCarrot', x: e.x + 0.12 * e.size, y: gy - 0.98 * e.size, homeDx: 0.06 * e.size, homeDy: -1.0 * e.size, vx: rand(80, 200) * (Math.random() < 0.5 ? -1 : 1), vy: -rand(200, 320), rot: 0, spin: rand(-12, 12), ret: 0, size: e.size });
      for (const n of ['smArmL', 'smArmR']) pieces.push({ owner: e, type: 'img', name: n, x: e.x + (n === 'smArmL' ? -0.3 : 0.3) * e.size, y: gy - 0.75 * e.size, homeDx: (n === 'smArmL' ? -0.36 : 0.36) * e.size, homeDy: -0.72 * e.size, vx: (n === 'smArmL' ? -1 : 1) * rand(80, 180), vy: -rand(150, 300), rot: 0, spin: rand(-10, 10), ret: 0, size: e.size });
      snowSpray(e.x, gy - 30 * U, 0, 24, 220);
    }
    function knockHat(e) {
      if (e.noHat || e.state === 'broken') return;
      e.noHat = true;
      const gy = groundY(e.x);
      pieces.push({ owner: e, hatOnly: true, type: 'img', name: 'smHat', x: e.x, y: gy - 1.22 * e.size, homeDx: 0, homeDy: -1.22 * e.size, vx: rand(60, 160) * (Math.random() < 0.5 ? -1 : 1), vy: -rand(260, 380), rot: 0, spin: rand(-10, 10), ret: 0, size: e.size, retAt: T + 0.8 });
    }
    function updatePieces(dt) {
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        const o = p.owner;
        if (!o || o.dead) { pieces.splice(i, 1); continue; }
        if (p.hatOnly && !p.ret && T > p.retAt) p.ret = 0.0001;
        if (p.ret > 0) {
          if (!p.fromX) { p.fromX = p.x; p.fromY = p.y; p.fromRot = p.rot; }
          p.ret += dt / 0.6;
          const t = easeInOut(Math.min(1, p.ret));
          const tx = o.x + p.homeDx * (o.face < 0 ? -1 : 1), ty = groundY(o.x) + p.homeDy;
          p.x = lerp(p.fromX, tx, t);
          p.y = lerp(p.fromY, ty, t) - Math.sin(t * Math.PI) * 40 * U;
          p.rot = lerp(p.fromRot, 0, t);
          if (p.ret >= 1 && p.hatOnly) { o.noHat = false; squash(o, 0.12); pieces.splice(i, 1); }
          continue;
        }
        p.vy += 1400 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        const rr = p.type === 'ball' ? p.r : 6 * U;
        const gy = groundY(p.x) - rr * 0.9;
        if (p.y > gy) {
          p.y = gy;
          if (p.vy > 120) { p.vy = -p.vy * 0.32; p.vx *= 0.7; }
          else { p.vy = 0; p.vx *= Math.max(0, 1 - dt * 3); }
          p.spin = p.type === 'ball' ? p.vx / Math.max(4, p.r) : p.spin * 0.9;
        }
        p.x = clamp(p.x, 8, W - 8);
      }
    }
    function drawPieces() {
      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.type === 'ball') {
          const c = snowBall(p.r);
          ctx.drawImage(c, -p.r - 2 / DPR, -p.r - 2 / DPR, c.width / DPR, c.height / DPR);
          if (p.eyes) {
            ctx.fillStyle = '#3b2f45';
            ctx.beginPath(); ctx.ellipse(-p.r * 0.3, -p.r * 0.15, p.r * 0.07, p.r * 0.13, 0, 0, TAU); ctx.ellipse(p.r * 0.3, -p.r * 0.15, p.r * 0.07, p.r * 0.13, 0, 0, TAU); ctx.fill();
          }
        } else {
          // кусок исходного кадра: центрируем по его bbox
          const rec = IMG[p.name];
          const d = SPR[p.name];
          if (rec && rec.ok) {
            const cxp = (d[1] + d[3]) / 2 / 256, cyp = (d[2] + d[4]) / 2 / 256;
            const c = scaled(p.name, p.size, false);
            ctx.drawImage(c, -cxp * p.size, -cyp * p.size, p.size, p.size);
          }
        }
        ctx.restore();
      }
    }
    function drawSnowman(e, x, surfY, size, opt) {
      // рисуем через общую функцию с кастомной отрисовкой слоёв (тело, руки)
      const body = e.noHat ? 'smNoHat' : 'smBody';
      drawActorSprite(e, body, surfY, {
        custom: (fs, sx, sy) => {
          drawFrame(body, size, fs * sx, sy, undefined, 'smBody');
          drawFrame('smArmL', size, fs * sx, sy, undefined, 'smBody');
          // правая рука — машет, вращаясь вокруг «плеча»
          const a = e.arm || 0;
          if (a) {
            const pxl = ((196 - 128) / 256) * size * fs * sx, pyl = ((124 - 240) / 256) * size * sy;
            ctx.save(); ctx.translate(pxl, pyl); ctx.rotate(-a * Math.sign(fs)); ctx.translate(-pxl, -pyl);
            drawFrame('smArmR', size, fs * sx, sy, undefined, 'smBody');
            ctx.restore();
          } else drawFrame('smArmR', size, fs * sx, sy, undefined, 'smBody');
        },
      });
    }

    // ------------------------------------------------------------------ PENGUIN
    function spawnPenguin(pair) {
      if (!ok('penguin')) return null;
      if (adults('penguin') >= 1) return null;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const size = 74 * U * rand(0.94, 1.05);
      const e = newActor('penguin', size, { dir, face: dir, speed: rand(42, 56) * U, ph: 0, slid: false, lookCd: rand(2, 5), chick: false });
      e.x = dir > 0 ? -50 * U : W + 50 * U; e.y = groundY(e.x);
      actors.push(e);
      if (pair === true || (pair !== false && !S.calm && Math.random() < 0.45)) {
        const c = newActor('penguin', size * 0.6, { dir, face: dir, speed: e.speed, ph: 1, slid: true, lookCd: rand(3, 6), chick: true, parent: e });
        c.x = e.x - dir * 70 * U; c.y = groundY(c.x);
        actors.push(c);
      }
      return e;
    }
    function updatePenguin(e, dt) {
      e.t += dt; e.st += dt;
      const gy = groundY(e.x);
      if (e.state === 'walk') {
        let sp = e.speed;
        if (e.chick) {
          const p = e.parent;
          if (p && !p.dead) {
            const want = p.x - p.dir * 62 * U;
            const d = (want - e.x) * e.dir;
            if (p.state === 'walk') e.dir = p.dir;
            sp = d > 30 * U ? p.speed * 1.75 : d < -10 * U ? p.speed * 0.4 : p.speed * 0.95;
          }
        }
        const prev = e.ph;
        e.ph += dt * (4.2 + sp / (14 * U));
        e.x += e.dir * sp * dt;
        e.tilt = Math.sin(e.ph) * 0.09;            // ±5° (спокійніше, CR-5)
        e.lift = Math.abs(Math.sin(e.ph)) * 3 * U * (e.chick ? 0.7 : 1);
        if (Math.floor(prev / Math.PI) !== Math.floor(e.ph / Math.PI)) {
          addPrint(e.x, 0, Math.floor(e.ph / Math.PI) % 2 ? 1 : -1);
          dentDrift(e.x, 0.15, 3);
          squash(e, 0.05);
        }
        e.lookCd -= dt;
        if (e.lookCd <= 0 && e.x > 40 && e.x < W - 40) {
          e.lookCd = rand(5, 10);
          if (Math.random() < (e.chick ? 0.35 : 0.5)) { e.state = 'look'; e.st = 0; e.stDur = e.chick ? rand(0.6, 1.2) : rand(1.5, 3); }
        }
        // сам скатывается с горки
        if (!e.slid && !e.chick && S.drifts) {
          const slope = (driftH(e.x + e.dir * 24) - driftH(e.x)) / 24;
          if (slope < -0.32 && e.x > 30 && e.x < W - 30) { e.slid = true; startSlide(e, e.dir, rand(240, 330) * U, false); }
        }
        if ((e.dir > 0 && e.x > W + 60 * U) || (e.dir < 0 && e.x < -60 * U)) e.dead = true;
      } else if (e.state === 'look') {
        e.lift = 0;
        e.tilt = Math.sin(e.st * 2.4) * 0.09;
        if (e.st > 0.4 && e.st < 0.9) e.sq = Math.sin(e.st * 30) * 0.06; // машет крыльями
        if (e.st > e.stDur) { e.state = 'walk'; e.st = 0; }
      } else if (e.state === 'slide') {
        e.lift = 0; e.tilt = 0;
        e.rot = lerp(e.rot, e.dir * 1.32, Math.min(1, dt * 14));
        e.slideV = Math.max(0, e.slideV - e.decel * dt);
        e.x += e.dir * e.slideV * dt;
        if (Math.random() < dt * 30) snowSpray(e.x + e.dir * e.size * 0.35, gy, e.dir, 2, 90 + e.slideV * 0.4);
        if (Math.abs(e.x - (e.px || 0)) > 6) { addPrint(e.x, 4); dentDrift(e.x, 0.6, 8); e.px = e.x; }
        if (e.slideV < 25 * U) { e.state = 'getup'; e.st = 0; }
        if (offscreen(e, 80 * U)) e.dead = true;
      } else if (e.state === 'fallen') {
        e.rot = lerp(e.rot, -e.dir * 1.45, Math.min(1, dt * 12));
        if (e.st > 1.2) { e.state = 'getup'; e.st = 0; }
      } else if (e.state === 'getup') {
        e.rot = lerp(e.rot, 0, Math.min(1, dt * 9));
        if (e.st > 0.25) { e.rot = 0; e.state = 'shake'; e.st = 0; squash(e, -0.12); }
      } else if (e.state === 'shake') {
        e.tilt = Math.sin(e.st * 38) * 0.1 * (1 - e.st / 0.3);
        if (Math.random() < dt * 40) snowSpray(e.x + rand(-10, 10) * U, gy - e.size * 0.4, rand(-1, 1), 1, 120);
        if (e.st > 0.3) { e.state = 'walk'; e.st = 0; e.tilt = 0; }
      }
      e.y = gy;
      updateSpring(e, dt);
    }
    function startSlide(e, dir, v, fromClick) {
      e.dir = dir; e.state = 'slide'; e.st = 0; e.slideV = v;
      const dist = rand(150, 200) * U;
      e.decel = (v * v) / (2 * dist);
      squash(e, 0.16);
      snowSpray(e.x, groundY(e.x), dir, 10, 160);
      if (fromClick) { emit('penguinSlide', {}); sfx('plop'); }
    }

    // ------------------------------------------------------------------ SQUIRREL
    function spawnSquirrel() {
      if (!ok('sqRun') || count('squirrel') >= 1) return null;
      const size = 86 * U * rand(0.95, 1.05);
      const e = newActor('squirrel', size, { state: 'run', hp: 0, decide: rand(1, 2.5), life: 0, lifeMax: rand(28, 45), carry: null, carryT: 0, fleeing: 0 });
      const vis = wins.filter((w) => w.landable && w.y > topInset + 80 && winVisibleAt(w, w.x + w.w / 2));
      if (vis.length && Math.random() < 0.5) {
        const w = pick(vis);
        e.x = clamp(w.x + w.w * rand(0.2, 0.8), 20, W - 20); e.y = -40; e.vx = 0; e.vy = 0; e.air = true; e.state = 'fall'; e.targetWin = null;
        e.dir = Math.random() < 0.5 ? 1 : -1;
      } else {
        e.dir = Math.random() < 0.5 ? 1 : -1;
        e.x = e.dir > 0 ? -30 * U : W + 30 * U; e.y = groundY(e.x);
      }
      e.face = e.dir;
      actors.push(e);
      return e;
    }
    function startFlee(e, dir) {
      if (e.state === 'fall' || e.state === 'jump') return;
      if (e.state === 'eat' || e.state === 'sit' || e.state === 'dig') dropCarry(e);
      e.state = 'run'; e.fleeing = 2.6; e.dir = dir; e.leaving = true; e.decide = 0.05;
      squash(e, -0.15);
    }
    function dropCarry(e) {
      if (!e.carry) return;
      const it = e.carry; e.carry = null;
      it.carried = false; it.x = e.x; it.y = (e.cy || e.y) - 10; it.vx = rand(-60, 60); it.vy = -120; it.resting = false; it.air = true; it.onWin = null; it.restT = 0;
      if (!it.fake) items.push(it);
    }
    function squirrelJumpToWindow(e, fromGround) {
      const cur = e.onWin ? winById.get(e.onWin) : null;
      const curY = e.y;
      let best = null, bestD = 1e9;
      for (const w of wins) {
        if (!w.landable || (cur && w.id === cur.id)) continue;
        const dy = w.y - curY;
        if (Math.abs(dy) > (fromGround ? 230 : 200) || (fromGround && dy > -30)) continue;
        // точка приземления впереди по ходу
        const edge = e.x;
        const lx0 = e.dir > 0 ? Math.max(w.x + 18, edge + 50) : Math.min(w.r - 18, edge - 50);
        if (lx0 <= w.x + 10 || lx0 >= w.r - 10) continue;
        const dx = Math.abs(lx0 - edge);
        if (dx > 300) continue;
        if (!winVisibleAt(w, lx0)) continue;
        const d = dx + Math.abs(dy) * 0.5;
        if (d < bestD) { bestD = d; best = { w, lx: lx0 }; }
      }
      if (!best) return false;
      const tx = best.lx, ty = winTop(best.w, tx);
      const dist = Math.hypot(tx - e.x, ty - e.y);
      const dur = 0.42 + dist / 1100;
      const G = 1500;
      e.vx = (tx - e.x) / dur;
      e.vy = (ty - e.y - 0.5 * G * dur * dur) / dur;
      e.air = true; e.onWin = null; e.targetWin = best.w.id; e.state = 'jump'; e.st = 0;
      squash(e, 0.16); e.prejump = 0.08;
      return true;
    }
    function squirrelJumpDown(e) {
      e.vx = e.dir * rand(110, 170) * U; e.vy = -rand(160, 240); e.air = true; e.onWin = null; e.targetWin = null; e.state = 'fall'; e.st = 0;
      squash(e, 0.12);
    }
    function updateSquirrel(e, dt) {
      e.t += dt; e.st += dt; e.life += dt;
      if (e.fleeing > 0) e.fleeing -= dt;
      const mx = mouse.x, my = mouse.y;
      const near = mouse.on ? Math.hypot(mx - e.x, my - (e.y - 18 * U)) : 1e9;
      // пугливая: быстрый курсор ближе 120 px
      if (S.cursor !== false && near < 120 && mouse.speed > 650 && e.state !== 'fall' && e.state !== 'jump' && !(e.fleeing > 0)) {
        startFlee(e, mx < e.x ? 1 : -1);
        emit('squirrelScared', {});
      }
      const hopDur = e.fleeing > 0 ? 0.2 : 0.27;
      const hopH = (e.fleeing > 0 ? 17 : 12) * U;
      switch (e.state) {
        case 'fall':
        case 'jump': {
          e.lift = 0;
          e.rot = clamp(e.vy / 1400, -0.5, 0.5) * -e.dir * 0.8;
          if (airStep(e, dt, true, 1500)) {
            e.rot = 0; e.state = 'run'; e.st = 0; e.hp = 0; squash(e, 0.2);
            snowSpray(e.x, e.y, 0, 5, 80);
            if (e.onWin) knockCap(e.onWin, e.x, 4);
          }
          break;
        }
        case 'run': {
          const sp = (e.fleeing > 0 ? 430 : e.carry ? 165 : 150) * U;
          const prevHp = e.hp;
          e.hp += dt / hopDur;
          if (e.hp >= 1) {
            e.hp -= 1; squash(e, 0.16);
            if (!e.onWin) { addPrint(e.x, 1); dentDrift(e.x, 0.1, 2); }
            else if (Math.random() < 0.5) knockCap(e.onWin, e.x, 1.5);
          } else if (prevHp < 0.08 && e.hp >= 0.08) squash(e, -0.1);
          e.lift = Math.sin(Math.PI * e.hp) * hopH;
          e.rot = -(0.5 - e.hp) * 0.12 * (e.face >= 0 ? 1 : -1);
          const nx = e.x + e.dir * sp * dt;
          if (e.onWin) {
            const w = winById.get(e.onWin);
            if (!w || !w.landable) { e.air = true; e.onWin = null; e.state = 'fall'; e.vx = e.dir * sp * 0.5; e.vy = 0; break; }
            const ahead = nx + e.dir * 10 * U;
            if (!winVisibleAt(w, ahead)) {
              if (!squirrelJumpToWindow(e, false)) squirrelJumpDown(e);
              break;
            }
            e.x = nx; e.y = winTop(w, e.x);
          } else {
            e.x = nx; e.y = groundY(e.x);
            if (offscreen(e, 40 * U)) {
              if (e.leaving || e.fleeing > 0) { dropCarry(e); e.dead = true; break; }
              e.dir = e.x < 0 ? 1 : -1;
            }
          }
          // поведение
          e.decide -= dt;
          if (e.carry) e.carryT += dt;
          if (!e.carry && !e.leaving && !(e.fleeing > 0)) {
            const it = findLoot(e);
            if (it) {
              e.dir = it.x > e.x ? 1 : -1;
              if (Math.abs(it.x - e.x) < 12 * U) { pickUp(e, it); }
            }
            // откопать спрятанное
            if (!e.onWin && buried.length) {
              for (let i = 0; i < buried.length; i++) {
                const b = buried[i];
                if (Math.abs(b.x - e.x) < 10 && !b.checked) { b.checked = true; if (Math.random() < 0.5) { e.state = 'dig'; e.st = 0; e.unbury = b; buried.splice(i, 1); } break; }
              }
            }
          }
          if (e.state !== 'run') break;
          if (e.carry && e.carryT > e.carryFor && !e.onWin && e.x > 30 && e.x < W - 30) { e.state = 'dig'; e.st = 0; e.unbury = null; break; }
          if (e.decide <= 0) {
            e.decide = rand(1.2, 3.2);
            if (e.fleeing > 0) {
              if (!e.onWin && Math.random() < 0.7) squirrelJumpToWindow(e, true);
              break;
            }
            if (e.life > e.lifeMax && !e.leaving) { e.leaving = true; e.dir = nearestEdgeDir(e.x); break; }
            if (e.leaving) break;
            const r = Math.random();
            if (r < 0.3 && e.x > 20 && e.x < W - 20) { e.state = 'sit'; e.st = 0; e.sitFor = rand(3, 6); }
            else if (r < 0.55 && !e.onWin) squirrelJumpToWindow(e, true);
            else if (r < 0.7) e.dir = -e.dir;
          }
          break;
        }
        case 'sit':
        case 'eat': {
          e.lift = 0; e.rot = lerp(e.rot, 0, Math.min(1, dt * 10));
          const sur = surfaceOf(e);
          if (sur == null) { e.state = 'fall'; break; }
          e.y = sur;
          // грызёт: мелкая пульсация и крошки
          e.sq = Math.sin(e.st * 34) * 0.035;
          const pawX = e.x + (e.face >= 0 ? 1 : -1) * e.size * 0.2, pawY = e.y - e.size * 0.42;
          if (Math.random() < dt * 9) crumbs(pawX, pawY, e.state === 'eat' || !e.carry || e.carry.kind === 'nut' ? ['#8a5a2b', '#c48a4a', '#f2d29b'] : ['#ff9d1c', '#ffbf47', '#fff1c9'], 1);
          if (mouse.on && near < 160 && mouse.speed < 400) e.dir = mx >= e.x ? 1 : -1;
          const dur = e.state === 'eat' ? 1.4 : e.sitFor;
          if (e.st > dur) {
            if (e.state === 'eat' && !e.onWin) { e.state = 'dig'; e.st = 0; e.unbury = null; e.buryNut = true; }
            else { e.state = 'run'; e.st = 0; e.hp = 0; e.decide = rand(1, 2.5); }
          }
          break;
        }
        case 'dig': {
          e.lift = 0;
          e.rot = lerp(e.rot, (e.face >= 0 ? 1 : -1) * 0.3, Math.min(1, dt * 10));
          e.y = groundY(e.x);
          e.sq = Math.sin(e.st * 40) * 0.05;
          if (Math.random() < dt * 30) snowSpray(e.x - (e.face >= 0 ? 1 : -1) * e.size * 0.1, e.y, -(e.face >= 0 ? 1 : -1), 1, 130);
          if (e.st > 1.2) {
            if (e.unbury) {
              const b = e.unbury; e.unbury = null;
              const it = makeItem(b.kind, b.x, groundY(b.x) - 6); it.resting = true; it.air = false;
              pickUp(e, it, true);
            } else if (e.carry || e.buryNut) {
              const kind = e.carry ? e.carry.kind : 'nut';
              e.carry = null; e.buryNut = false;
              if (buried.length > 12) buried.shift();
              buried.push({ x: e.x, kind, t: T, checked: false });
              dentDrift(e.x, -2, 6);
              emit('squirrelBuried', { kind });
            }
            e.rot = 0; e.state = 'run'; e.st = 0; e.hp = 0; e.decide = rand(0.8, 2);
          }
          break;
        }
      }
      updateSpring(e, dt);
    }
    function knockCap(id, x, amt) {
      const w = winById.get(id); const cap = caps.get(id);
      if (!w || !cap) return;
      const k = Math.floor((x - w.x) / BIN);
      for (let j = k - 2; j <= k + 2; j++) {
        if (j < 0 || j >= cap.depth.length) continue;
        const d = cap.depth[j];
        if (d > 1.5) { const take = Math.min(d, amt * (j === k ? 1 : 0.5)); cap.depth[j] = d - take; if (Math.random() < 0.5) spawnChunk(w.x + (j + 0.5) * BIN, w.y - d * 0.5); }
      }
    }
    function findLoot(e) {
      let best = null, bd = 230 * U;
      for (const it of items) {
        if (!it.resting || it.carried || it.dying || (it.kind !== 'tangerine' && it.kind !== 'nut')) continue;
        if ((it.onWin || null) !== (e.onWin || null)) continue;
        const d = Math.abs(it.x - e.x);
        if (d < bd) { bd = d; best = it; }
      }
      return best;
    }
    function pickUp(e, it, already) {
      if (!already) { const i = items.indexOf(it); if (i >= 0) items.splice(i, 1); }
      it.carried = true; e.carry = it; e.carryT = 0; e.carryFor = rand(2, 4.5);
      squash(e, 0.12);
      emit('squirrelPicked', { kind: it.kind });
    }
    function clickSquirrel(e) {
      if ((e.state === 'sit' || (e.state === 'run' && e.fleeing <= 0 && mouse.speed < 300)) && !e.carry) {
        e.state = 'eat'; e.st = 0; e.dir = mouse.x >= e.x ? 1 : -1;
        stats.nutsFed++;
        emit('squirrelFed', { count: stats.nutsFed });
        sfx('crunch');
      } else startFlee(e, mouse.x < e.x ? 1 : -1);
    }

    // ------------------------------------------------------------------ ITEMS
    function countItems(kind) { let n = 0; for (const it of items) if (!kind || it.kind === kind) n++; return n; }
    function makeItem(kind, x, y) {
      const size = (kind === 'tangerine' ? 40 : kind === 'nut' ? 30 : 40) * U * rand(0.92, 1.08);
      return {
        kind, size, x, y, vx: 0, vy: 40, v: (Math.random() * 3) | 0, rot: rand(-0.4, 0.4), spin: rand(-1.5, 1.5), sway: rand(6, 14), freq: rand(0.8, 1.4), ph: rand(0, TAU),
        air: true, resting: false, restT: 0, restFor: rand(15, 20), bounces: 0, alpha: 1, onWin: null, dying: 0, carried: false,
        hb: { x0: 0, y0: 0, x1: 0, y1: 0, on: false },
      };
    }
    function spawnItem(kind, x, y, vx, vy) {
      if (!ok(kind)) return null;
      if (countItems() >= 4) return null;
      if (kind === 'tangerine' && countItems('tangerine') >= 3) return null;
      const it = makeItem(kind, x == null ? rand(40, W - 40) : x, y == null ? -30 : y);
      if (vx != null) it.vx = vx;
      if (vy != null) it.vy = vy;
      items.push(it);
      return it;
    }
    function updateItems(dt, wind) {
      const mOn = S.cursor && mouse.on;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const r = it.size * 0.42;
        if (it.dying) {
          it.dying -= dt; it.alpha = clamp(it.dying / 0.6, 0, 1);
          if (it.dying <= 0) { items.splice(i, 1); continue; }
        }
        if (it.resting) {
          // пинок курсором (I-02): нужно касание и движение
          if (mOn && !it.dying && mouse.speed > 140) {
            const dx = it.x - mouse.x, dy = (it.y - r) - mouse.y;
            if (dx * dx + dy * dy < (r + 10) * (r + 10)) {
              const kx = clamp(mouse.vx * 0.55, -380, 380);
              it.resting = false; it.air = true; it.onWin = null; it.bounces = 0;
              it.vx = Math.abs(kx) > 40 ? kx : (dx >= 0 ? 1 : -1) * rand(140, 220);
              it.vy = -rand(240, 360); it.spin = it.vx / Math.max(r, 4); it.restT = 0;
              emit('tangerineKicked', { kind: it.kind });
              continue;
            }
          }
          // катится и останавливается
          it.vx *= Math.max(0, 1 - dt * 2.4);
          it.x += it.vx * dt; it.rot += (it.vx / Math.max(r, 4)) * dt;
          if (it.onWin) {
            const w = winById.get(it.onWin);
            if (!w || !winVisibleAt(w, it.x)) { it.onWin = null; it.resting = false; it.air = true; it.vy = 0; continue; }
            it.y = winTop(w, it.x);
          } else it.y = groundY(it.x);
          if (Math.abs(it.vx) < 4) it.rot = lerp(it.rot, Math.round(it.rot / TAU) * TAU + 0, Math.min(1, dt * 2));
          it.restT += dt;
          if (it.restT > it.restFor && !it.dying) { it.dying = 0.9; it.sinking = true; }
          if (it.x < -40 || it.x > W + 40) items.splice(i, 1);
          continue;
        }
        // полёт
        const py = it.y;
        it.vx += (wind * 0.4 - it.vx) * Math.min(1, dt * 0.5);
        it.vy = Math.min(it.vy + 600 * dt, 150 + it.size);
        const sway = it.bounces === 0 && it.vy > 0 ? it.sway * Math.sin(T * it.freq + it.ph) : 0;
        it.x += (it.vx + sway) * dt; it.y += it.vy * dt; it.rot += it.spin * dt;
        if (it.x < -60 || it.x > W + 60) { items.splice(i, 1); continue; }
        if (it.vy > 0) {
          let landed = false, top = 0;
          for (const w of wins) {
            if (!w.landable || it.x <= w.x + 6 || it.x >= w.r - 6) continue;
            top = winTop(w, it.x);
            if (py <= top && it.y >= top && !occluded(it.x, w.y - 1, w.idx)) { it.onWin = w.id; landed = true; break; }
          }
          if (!landed) { top = groundY(it.x); if (it.y >= top) { it.onWin = null; landed = true; } }
          if (landed) {
            it.y = top;
            if (it.kind === 'tangerine' && it.bounces === 0 && it.vy > 90) { it.vy = -it.vy * 0.38; it.bounces = 1; it.vx = rand(-60, 60); it.spin = it.vx / Math.max(r, 4); snowSpray(it.x, top, 0, 3, 60); }
            else { it.resting = true; it.air = false; it.vy = 0; it.spin = 0; snowSpray(it.x, top, 0, 2, 40); }
          }
        }
      }
    }
    function drawItem(it) {
      const rec = IMG[it.kind];
      if (!rec || !rec.ok) { it.hb.on = false; return; }
      const s = it.size;
      const r = s * Math.max(rec.cw, rec.ch) * 0.5;
      const sink = it.sinking ? (1 - it.alpha) * r : 0;
      const cy = it.y - r * 0.92 + sink + (it.resting && !it.onWin ? 2 : 0);
      if (it.resting || it.y > groundY(it.x) - 200) {
        const surf = it.onWin ? it.y : groundY(it.x);
        const h = clamp((surf - it.y) / 200, 0, 1);
        const sw = r * 1.6 * (1 - h * 0.5);
        ctx.globalAlpha = 0.7 * (1 - h) * it.alpha;
        ctx.drawImage(shadowImg, it.x - sw / 2, surf - sw * 0.1 + 1, sw, sw * 0.2);
      }
      ctx.save();
      ctx.globalAlpha = it.alpha;
      let fi = it.v, rr = it.rot;
      if (rec.nf === 6) { const st = Math.PI / 3, k = Math.round(it.rot / st); fi = ((k % 6) + 6) % 6; rr = it.rot - k * st; }
      ctx.translate(it.x, cy); ctx.rotate(rr);
      const c = scaled(it.kind, s, false, fi);
      const w = s * rec.aspect;
      ctx.drawImage(c, -rec.cx * w, -(rec.ty + rec.ch / 2) * s, w, s);
      ctx.restore();
      ctx.globalAlpha = 1;
      it.hb.x0 = it.x - r - 6; it.hb.x1 = it.x + r + 6; it.hb.y0 = cy - r - 6; it.hb.y1 = cy + r + 6; it.hb.on = true;
    }
    function clickItem(it) {
      const i = items.indexOf(it);
      if (i < 0) return;
      items.splice(i, 1);
      const cy = (it.hb.y0 + it.hb.y1) / 2;
      if (it.kind === 'tangerine') {
        // I-03: очищений мандарин (3D) на мить і кілька шматочків шкірки
        pops.push({ name: 'peeled', x: it.x, y: it.y, size: it.size * 1.15, t: 0, dur: 1.1 });
        for (let k = 0; k < 6; k++) part(it.x, cy, rand(-120, 120), rand(-200, -60), rand(0.5, 0.8), rand(2.5, 4) * U, pick(['#f07800', '#ff8a00', '#e86a04']), 2, 700, 0.3);
        stats.tangerinesEaten++;
        emit('tangerineEaten', { count: stats.tangerinesEaten });
        sfx('crunch');
      } else if (it.kind === 'gift') {
        openGift(it.x, cy);
      } else {
        crumbs(it.x, cy, ['#c98b4a', '#8a5a2b', '#f2d29b'], 6);
        sfx('pop');
        emit('surpriseCollected', { kind: it.kind });
      }
    }
    function openGift(x, y) {
      sparkle(x, y, '#ffe27a', 18, 140, 0.8);
      sfx('pop');
      const options = ['squirrel', 'penguin', 'tangerines'];
      let s = pick(options);
      if (s === 'squirrel' && (!ok('sqRun') || count('squirrel') >= 1)) s = 'tangerines';
      if (s === 'penguin' && (!ok('penguin') || adults('penguin') >= 1)) s = 'tangerines';
      if (s === 'squirrel') {
        const e = spawnSquirrel();
        if (e) { e.x = x; e.y = y; e.air = true; e.onWin = null; e.state = 'fall'; e.vx = rand(-120, 120); e.vy = -380; e.dir = e.vx >= 0 ? 1 : -1; e.face = e.dir; }
      } else if (s === 'penguin') {
        const e = spawnPenguin(false);
        if (e) { e.x = clamp(x, 20, W - 20); e.dir = x < W / 2 ? 1 : -1; e.face = e.dir; squash(e, -0.25); }
      } else if (s === 'tangerines') {
        const n = 2;
        for (let i = 0; i < n; i++) spawnItem('tangerine', clamp(x + rand(-140, 140), 30, W - 30), -30 - i * 40);
      }
      say(null, formatPhrase(nextWish(), nameForSpeech()), x, y - 30, 3.8);
      emit('giftOpened', { surprise: s });
    }

    // ------------------------------------------------------------------ SLEIGH
    function spawnSleigh() {
      if (!ok('sleigh') || !ok('deer') || sleighs.length >= 1) return null;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const s = {
        kind: 'sleigh', dir, p: 0, x: 0, y: 0, ph: 0, deer: Math.random() < 0.5 ? 2 : 3, sz: 1,
        y0: topInset + H * rand(0.2, 0.3), arc: H * rand(0.08, 0.14), dropAt: Math.random() < 0.34 ? rand(0.3, 0.7) : -1, clicked: 0,
        hb: { x0: 0, y0: 0, x1: 0, y1: 0, on: false },
      };
      s.len = (90 + s.deer * 62) * U;
      s.speed = 210 * U;
      s.dist = W + s.len * 2 + 80;
      sleighs.push(s);
      return s;
    }
    function updateSleighs(dt) {
      for (let i = sleighs.length - 1; i >= 0; i--) {
        const s = sleighs[i];
        s.p += (s.speed * dt) / s.dist;
        s.ph += dt * 9;
        const travel = s.p * s.dist - s.len - 40;
        s.x = s.dir > 0 ? travel : W - travel;
        s.y = s.y0 - s.arc * Math.sin(Math.PI * clamp(s.p, 0, 1));
        if (Math.random() < dt * 18) part(s.x - s.dir * 50 * U + rand(-6, 6), s.y + rand(-4, 12) * U, -s.dir * rand(10, 40), rand(-10, 20), rand(0.7, 1.5), rand(1.2, 2.6), pick(['#ffe680', '#fff4c2', '#ffd24d']), 0, 30, 0.5);
        if (s.dropAt > 0 && s.p >= s.dropAt) { s.dropAt = -1; dropGiftFrom(s); }
        if (s.p >= 1) sleighs.splice(i, 1);
      }
    }
    function dropGiftFrom(s) {
      const it = spawnItem('gift', s.x, s.y, s.dir * 90, -60);
      if (it) it.spin = rand(-2, 2);
    }
    function clickSleigh(s) {
      if (T - s.clicked < 1.2) return;
      s.clicked = T;
      say(s, 'Хо-хо-хо!');
      sfx('hoho');
      dropGiftFrom(s);
      sparkle(s.x, s.y, '#ffe27a', 30, 140, 1.2);
      emit('santaHoHo', {});
    }
    function drawSleigh(s) {
      const dir = s.dir;
      const rec = IMG.sleigh;
      if (!rec || !rec.ok) { s.hb.on = false; return; }
      const sz = 118 * U, deerSize = 60 * U, headSize = 40 * U;
      const half = (rec.cw * sz) / 2;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const ext = (ax, ay, bx, by) => { x0 = Math.min(x0, ax); x1 = Math.max(x1, bx); y0 = Math.min(y0, ay); y1 = Math.max(y1, by); };
      // олені попереду (м'яке почергове підстрибування)
      const deerPos = [];
      for (let i = 0; i < s.deer; i++) {
        const dx = s.x + dir * (half + deerSize * 0.45 + i * deerSize * 0.92);
        const bob = Math.abs(Math.sin(s.ph * 0.7 + i * 1.7)) * 4 * U;
        deerPos.push([dx, s.y - sz * 0.12 - bob]);
      }
      ctx.strokeStyle = 'rgba(232,184,74,.95)'; ctx.lineWidth = 1.4 * U;
      ctx.beginPath();
      ctx.moveTo(s.x + dir * half * 0.55, s.y - sz * 0.38);
      for (const [dx, dy] of deerPos) ctx.lineTo(dx - dir * deerSize * 0.1, dy - deerSize * 0.45);
      ctx.stroke();
      for (let i = deerPos.length - 1; i >= 0; i--) {
        const [dx, dy] = deerPos[i];
        ctx.save(); ctx.translate(dx, dy);
        drawFrame('deer', deerSize, dir * IMG.deer.nat, 1);
        ctx.restore();
        ext(dx - deerSize * 0.45, dy - deerSize * 0.9, dx + deerSize * 0.45, dy);
      }
      // сани (3D) і голова Санти в точці шиї
      ctx.save(); ctx.translate(s.x, s.y); drawFrame('sleigh', sz, dir, 1); ctx.restore();
      if (ok('santa')) {
        const nx = ((SLEIGH_NECK[0] - rec.cx * rec.fw) / rec.fh) * sz * dir, ny = ((SLEIGH_NECK[1] - rec.by * rec.fh) / rec.fh) * sz;
        ctx.save(); ctx.translate(s.x + nx, s.y + ny + headSize * 0.12); drawFrame('santa', headSize, dir, 1); ctx.restore();
      }
      ext(s.x - half, s.y - rec.ch * sz - headSize * 0.5, s.x + half, s.y);
      s.hb.x0 = x0 - 6; s.hb.x1 = x1 + 6; s.hb.y0 = y0 - 6; s.hb.y1 = y1 + 6; s.hb.on = true;
    }

    // ------------------------------------------------------------------ SNOWMOBILES
    function callSnowmobile() {
      snowmobileRef = T;
      if (greeter) { snowmobilePending = true; return; }
      startConvoy();
    }
    function startConvoy() {
      snowmobilePending = false;
      if (convoy) return;
      const dir = (startConvoy.lastDir = -(startConvoy.lastDir || -1));
      const n = S.calm ? 1 : 2; // колона: 2 снігоходи, у спокійному режимі — 1
      const len = smLen() * 1.05;
      const speed = Math.max(170 * U, (W + len * (n + 1)) / 10.5);
      const veh = [];
      for (let i = 0; i < n; i++) {
        const x = dir > 0 ? -len * 0.7 - i * len * 1.15 : W + len * 0.7 + i * len * 1.15;
        veh.push({ kind: 'snowmobile', i, ci: i, plow: i === 0, x, y: groundY(x), speed, face: dir, spin: 0, rut: x, tilt: 0, donut: 0, hb: { x0: 0, y0: 0, x1: 0, y1: 0, on: false } });
      }
      convoy = { dir, veh, speed, t: 0, announce: 3, len, spacing: len * 1.15, done: false };
      plowed.fill(0);
      humStart();
      emit('snowmobileArrive', { count: n });
    }
    function updateConvoy(dt) {
      if (!convoy) return;
      const c = convoy;
      c.t += dt;
      if (c.announce > 0) {
        c.announce -= dt;
        humLevel(clamp(1 - c.announce / 3, 0.05, 1));
        return;
      }
      const dir = c.dir;
      for (let i = 0; i < c.veh.length; i++) {
        const v = c.veh[i];
        if (v.donut > 0) {
          v.donut -= dt;
          const t = 1 - v.donut / 1.3;
          v.face = Math.cos(t * TAU) * dir;
          if (Math.random() < dt * 60) snowSpray(v.x + rand(-30, 30) * U, groundY(v.x), Math.sign(Math.sin(t * TAU)) || 1, 2, 220);
          if (v.donut <= 0) v.face = dir;
        } else {
          let sp = c.speed;
          if (i > 0) {
            const ahead = c.veh[i - 1];
            const gap = (ahead.x - v.x) * dir;
            sp = clamp(c.speed + (gap - c.spacing) * 2.2, 0, c.speed * 1.8);
          }
          v.x += dir * sp * dt;
        }
        const front = v.x + dir * smFront(v);
        // отвал: срезаем сугроб до ~10 %
        if (v.plow) {
          const k0 = Math.floor((front - dir * 4) / BIN), k1 = Math.floor((front + dir * 10) / BIN);
          for (let k = Math.min(k0, k1); k <= Math.max(k0, k1); k++) {
            if (k < 0 || k >= drift.length || plowed[k]) continue;
            plowed[k] = 1;
            const before = drift[k];
            const removed = before * 0.9;
            drift[k] = before * 0.1;
            if (removed > 1 && !(S.calm && plowAlive >= 20)) { const n0 = parts.length; snowSpray(k * BIN, baseY() - before * 0.6, dir, Math.min(S.calm ? 2 : 6, 1 + (removed / 6) | 0), 220 + removed * 5); for (let q = n0; q < parts.length; q++) { parts[q].plow = 1; plowAlive++; } }
          }
          // мандаринки и предметы — отлетают
          for (const it of items) {
            if (it.onWin || it.carried) continue;
            const d = (it.x - front) * dir;
            if (d > -10 && d < 26 * U) { it.resting = false; it.air = true; it.vy = -rand(260, 380); it.vx = dir * (c.speed + rand(80, 200)); it.spin = dir * 8; it.bounces = 1; it.restT = 0; }
          }
        } else {
          // ведомые держат снег низким
          const k = Math.floor(front / BIN);
          if (k >= 0 && k < drift.length && plowed[k] && drift[k] > 4) drift[k] = Math.max(2, drift[k] * 0.5);
        }
        if (Math.abs(v.x - v.rut) > 7) { addPrint(v.x - dir * 0.2 * smLen(), 3); v.rut = v.x; }
        // выхлоп
        if (Math.random() < dt * 14) part(v.x - dir * 0.42 * smLen(), groundY(v.x) - 18 * U, -dir * rand(20, 50), -rand(10, 30), rand(0.6, 1.1), rand(3, 6) * U, null, 3, -20, 1);
        // уклон
        const span = 0.3 * smLen();
        const ga = groundY(v.x - span), gb = groundY(v.x + span);
        v.tilt = lerp(v.tilt, Math.atan2(gb - ga, span * 2), Math.min(1, dt * 8));
        v.y = Math.min(ga, gb, groundY(v.x));
      }
      // персонажи на пути — убегают/отпрыгивают
      const lead = c.veh[0];
      for (const a of actors) {
        if (a.dead || a.onWin || a.air) continue;
        const d = (a.x - lead.x) * dir;
        if (d > 0 && d < 260 * U + a.size) escapeFrom(a, dir, c.speed);
      }
      // все уехали?
      const last = c.veh[c.veh.length - 1];
      if ((dir > 0 && last.x > W + c.len) || (dir < 0 && last.x < -c.len)) {
        convoy = null; plowed.fill(0); humStop();
        emit('snowmobileDone', {});
      }
    }
    function escapeFrom(a, dir, speed) {
      if (a.kind === 'squirrel') {
        if (a.state === 'run' && !(a.fleeing > 0)) { startFlee(a, dir); if (!squirrelJumpToWindow(a, true)) a.dir = dir; }
      } else if (a.kind === 'penguin') {
        if (a.state !== 'slide') { startSlide(a, dir, speed * 1.35, false); a.decel = 8; }
        else a.slideV = Math.max(a.slideV, speed * 1.3);
      } else if (a.kind === 'snowman') {
        if (a.state === 'broken') return;
        if (a.state !== 'flee') { a.state = 'flee'; a.dir = dir; a.fleeSpeed = speed + 60 * U; squash(a, -0.2); say(a, 'Ой!'); }
      }
    }
    function clickSnowmobile(v) {
      if (v.donut > 0) return;
      v.donut = 1.3;
      say(v, 'Бі-біп!');
      sfx('honk');
      emit('snowmobileHonk', {});
    }
    function drawConvoy() {
      const c = convoy;
      if (!c) return;
      if (c.announce > 0) {
        // фара м'яко блимає біля краю
        const ex = c.dir > 0 ? 0 : W, gy = groundY(ex) - 20 * U;
        const pulse = 0.6 + 0.4 * Math.sin(c.t * 6);
        const r = 80 * U;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(1 - c.announce / 3, 0.2, 1) * pulse * 0.8;
        ctx.drawImage(warmGlow, ex - r, gy - r, r * 2, r * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        return;
      }
      const size = smSize();
      for (const v of c.veh) {
        const name = 'sm' + v.ci, rec = IMG[name];
        if (!rec || !rec.ok) { v.hb.on = false; continue; }
        const L = rec.cw * size, Hh = rec.ch * size;
        ctx.globalAlpha = 0.8;
        ctx.drawImage(shadowImg, v.x - L * 0.55, v.y - 7 * U, L * 1.1, 14 * U);
        ctx.globalAlpha = 1;
        const fi = v.donut > 0 ? 0 : Math.floor(T * 16 + v.i * 2) % 4; // кадри руху (катки, протектор)
        ctx.save();
        ctx.translate(v.x, v.y + 1);
        ctx.rotate(v.tilt);
        const fs = Math.max(0.15, Math.abs(v.face)) * (v.face < 0 ? -1 : 1);
        drawFrame(name, size, fs, 1, undefined, undefined, fi);
        ctx.restore();
        // світло фари
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
        const fr = smFront(v) * 0.62;
        const hx = v.x + (v.face >= 0 ? 1 : -1) * fr * Math.abs(v.face), hy = v.y - Hh * 0.42;
        ctx.drawImage(warmGlow, hx - 24 * U, hy - 24 * U, 48 * U, 48 * U);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        v.hb.x0 = v.x - L * 0.5 - 6; v.hb.x1 = v.x + L * 0.5 + 6; v.hb.y0 = v.y - Hh - 6; v.hb.y1 = v.y + 6; v.hb.on = true;
      }
    }
    // длина корпуса снегохода в CSS px
    function smLen() { return 172 * U; }

    // ------------------------------------------------------------------ SNOWBALL (I-09)
    function throwSnowball(x, y) {
      x = +x; y = +y;
      if (!isFinite(x) || !isFinite(y)) { x = mouse.on ? mouse.x : W / 2; y = mouse.on ? mouse.y : H / 2; }
      let target = null, bd = 700;
      for (const a of actors) {
        if (a.dead || !a.hb.on) continue;
        const ax = a.x, ay = (a.hb.y0 + a.hb.y1) / 2;
        const d = Math.hypot(ax - x, ay - y);
        if (d < bd) { bd = d; target = a; }
      }
      let sx, sy, tx, ty;
      if (target) {
        sx = x; sy = y;
        const ay = (target.hb.y0 + target.hb.y1) / 2;
        const dur0 = clamp(Math.hypot(target.x - x, ay - y) / 900, 0.3, 0.8);
        tx = target.x + (target.kind === 'snowman' ? target.dir * target.speed : 0) * dur0 * 0.6; ty = ay;
      } else {
        sx = x < W / 2 ? -20 : W + 20; sy = clamp(y + 240, 0, H);
        tx = x; ty = y;
      }
      const dur = clamp(Math.hypot(tx - sx, ty - sy) / 900, 0.3, 0.9);
      const G = 900;
      balls.push({ x: sx, y: sy, vx: (tx - sx) / dur, vy: (ty - sy - 0.5 * G * dur * dur) / dur, t: 0, dur, tx, ty, target, r: 8 * U, G });
      sfx('whoosh');
    }
    function updateBalls(dt) {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.t += dt; b.vy += b.G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (Math.random() < dt * 40) part(b.x, b.y, rand(-10, 10), rand(-10, 10), 0.35, 1.6, null, 1, 0, 1);
        if (b.t >= b.dur) {
          balls.splice(i, 1);
          for (let k = 0; k < 26; k++) { const a = rand(0, TAU), s = rand(40, 220); part(b.x, b.y, Math.cos(a) * s, Math.sin(a) * s - 60, rand(0.4, 0.9), rand(1.5, 3.5) * U, null, 1, 600, 0.8); }
          part(b.x, b.y, 0, -10, 0.5, 16 * U, null, 3, 0, 1);
          sfx('thud');
          let hit = null;
          for (const a of actors) {
            if (a.dead || !a.hb.on) continue;
            if (b.x > a.hb.x0 - 12 && b.x < a.hb.x1 + 12 && b.y > a.hb.y0 - 12 && b.y < a.hb.y1 + 12) { hit = a; break; }
          }
          if (hit) {
            if (hit.kind === 'snowman') knockHat(hit);
            else if (hit.kind === 'penguin') { if (hit.state !== 'slide') { hit.state = 'fallen'; hit.st = 0; squash(hit, 0.2); } }
            else if (hit.kind === 'squirrel') { dropCarry(hit); if (hit.state === 'eat') hit.state = 'run'; startFlee(hit, b.vx >= 0 ? 1 : -1); }
          }
          emit('snowballHit', { target: hit ? hit.kind : null, x: b.x, y: b.y });
        }
      }
    }
    function drawBalls() {
      for (const b of balls) {
        const r = b.r * (1 + 0.6 * (1 - b.t / b.dur));
        ctx.drawImage(snowballImg, b.x - r, b.y - r, r * 2, r * 2);
      }
    }

    // ------------------------------------------------------------------ GREETING (F-14, E-10)
    function greet(text, gopts) {
      let raw = text != null && String(text).trim() ? String(text) : randomPhrase();
      const msg = formatPhrase(raw, nameForSpeech());
      if (!msg) return;
      if (!greeter) {
        greeter = newActor('greeter', 150 * U, { phase: 'rise', pt: 0, text: msg, hold: clamp(6 + msg.length * 0.03, 6, 8), arm: 0, x0: 0 });
        greeter.x = W - 110 * U; greeter.dir = -1; greeter.face = -1;
        snowSpray(greeter.x, groundY(greeter.x), 0, 30, 220);
      } else {
        greeter.text = msg; greeter.hold = clamp(6 + msg.length * 0.03, 6, 8);
        if (greeter.phase === 'sink') { greeter.phase = 'rise'; greeter.pt = 0.3; }
        else if (greeter.phase === 'hold') greeter.pt = 0;
      }
      greeter.bubbleT = 0;
      // своё голосовое играет хост ({audio}) — тогда синтез не нужен
      greeter.spoken = !!(gopts && gopts.audio);
      emit('greet', { text: msg });
    }
    function updateGreeter(dt) {
      const g = greeter;
      if (!g) return;
      g.pt += dt; g.t += dt;
      g.x = W - 110 * U;
      if (g.phase === 'rise') {
        if (!g.spoken && g.pt > 0.35) { g.spoken = true; speak(g.text); }
        if (g.pt >= 0.7) { g.phase = 'hold'; g.pt = 0; squash(g, 0.1); }
      } else if (g.phase === 'hold') {
        g.bubbleT += dt;
        g.arm = g.pt < 1.4 ? 0.8 + Math.sin(g.pt * 9) * 0.5 : Math.max(0, g.arm - dt * 2); // помахав і спокійно стоїть
        g.tilt = 0;
        if (mouse.on) g.dir = mouse.x > g.x ? 1 : -1;
        if (g.pt > g.hold) { g.phase = 'sink'; g.pt = 0; g.arm = 0; snowSpray(g.x, groundY(g.x), 0, 16, 160); }
      } else if (g.phase === 'sink') {
        if (g.pt >= 0.6) {
          greeter = null;
          if (snowmobilePending) startConvoy();
          return;
        }
      }
      updateSpring(g, dt);
    }
    function drawGreeter() {
      const g = greeter;
      if (!g || !ok('smBody')) return;
      const gy = groundY(g.x);
      const vis = g.size * 1.0;
      let k;
      if (g.phase === 'rise') k = easeInOut(clamp(g.pt / 0.7, 0, 1));
      else if (g.phase === 'hold') k = 1;
      else k = 1 - easeInOut(clamp(g.pt / 0.6, 0, 1));
      const off = (1 - k) * vis;
      // «вылезает из сугроба»: обрезаем по уровню снега
      ctx.save();
      ctx.beginPath(); ctx.rect(g.x - g.size, 0, g.size * 2, gy + 4); ctx.clip();
      g.sink = off + 4 * U;
      drawSnowman(g, g.x, gy, g.size);
      ctx.restore();
      // облачко
      if (g.phase === 'hold' || (g.phase === 'rise' && g.pt > 0.55)) {
        const pop = g.phase === 'hold' ? 1 : 0;
        drawBubble(g.text, g.x - g.size * 0.25, gy - g.size * 1.02 + off, pop, true);
      }
    }

    // ------------------------------------------------------------------ bubbles / badges / text
    function nextWish() {
      if (!wishQueue.length) {
        wishQueue = WISHES.map((_, i) => i);
        for (let i = wishQueue.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = wishQueue[i]; wishQueue[i] = wishQueue[j]; wishQueue[j] = t; }
        if (wishQueue[wishQueue.length - 1] === lastWish) wishQueue.unshift(wishQueue.pop());
      }
      lastWish = wishQueue.pop();
      return WISHES[lastWish];
    }
    function say(ent, text, x, y, dur) {
      for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].ent && bubbles[i].ent === ent) bubbles.splice(i, 1);
      bubbles.push({ ent, text, x: x || 0, y: y || 0, t: 0, dur: dur || 1.4 });
    }
    function wrapText(text, maxW) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
    /** Облачко с хвостиком к точке (ax, ay). big — облачко привета. */
    function drawBubble(text, ax, ay, scale, big) {
      if (scale <= 0.01) return;
      const fs = big ? clamp(20 * U, 15, 22) : clamp(15 * U, 12, 16);
      ctx.font = '700 ' + fs + 'px ' + UI_FONT;
      const maxW = big ? Math.min(330 * U + 40, W * 0.6) : 220;
      const lines = wrapText(text, maxW);
      let tw = 0;
      for (const l of lines) tw = Math.max(tw, ctx.measureText(l).width);
      const padX = big ? 18 : 11, padY = big ? 12 : 7, lh = fs * 1.3;
      const bw = tw + padX * 2, bh = lines.length * lh + padY * 2;
      let bx = ax - bw + (big ? 40 : bw / 2), by = ay - bh - 18;
      bx = clamp(bx, 8, W - bw - 8);
      by = clamp(by, topInset + 8, H - bh - 8);
      ctx.save();
      const ox = clamp(ax, bx + 16, bx + bw - 16), oy = by + bh;
      ctx.translate(ox, oy); ctx.scale(scale, scale); ctx.translate(-ox, -oy);
      ctx.fillStyle = 'rgba(10,20,50,.18)';
      roundRect(bx + 1, by + 4, bw, bh, big ? 18 : 12); ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRect(bx, by, bw, bh, big ? 18 : 12); ctx.fill();
      // хвостик
      const tx = clamp(ax, bx + 18, bx + bw - 18);
      ctx.beginPath(); ctx.moveTo(tx - 10, oy - 1); ctx.lineTo(ax + (big ? 4 : 0), ay - 2); ctx.lineTo(tx + 6, oy - 1); ctx.closePath();
      ctx.fill();
      ctx.lineWidth = big ? 3 : 2; ctx.strokeStyle = '#d63232';
      roundRect(bx, by, bw, bh, big ? 18 : 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx - 10, oy); ctx.lineTo(ax + (big ? 4 : 0), ay - 2); ctx.lineTo(tx + 6, oy); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 9, oy - 3, 14, 4.5);
      ctx.fillStyle = '#b81a26'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], bx + padX, by + padY + i * lh + fs * 0.08);
      ctx.restore();
    }
    function drawBubbles(dt) {
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        if (b.t > b.dur || (b.ent && (b.ent.dead || (b.ent.kind === 'sleigh' && sleighs.indexOf(b.ent) < 0) || (b.ent.kind === 'snowmobile' && !convoy)))) { bubbles.splice(i, 1); continue; }
        let ax = b.x, ay = b.y;
        if (b.ent) { const hb = b.ent.hb; ax = (hb.x0 + hb.x1) / 2; ay = hb.y0 + 4; }
        const s = 1;
        ctx.globalAlpha = b.t < 0.15 ? b.t / 0.15 : b.t > b.dur - 0.25 ? Math.max(0, (b.dur - b.t) / 0.25) : 1;
        drawBubble(b.text, ax, ay, s, false);
        ctx.globalAlpha = 1;
      }
      // очищений мандарин: коротка поява і зникнення (≤ 1,5 с)
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += dt;
        if (p.t > p.dur) { pops.splice(i, 1); continue; }
        const rec = IMG[p.name];
        if (!rec || !rec.ok) continue;
        const k = p.t / p.dur;
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.save(); ctx.translate(p.x, p.y); drawFrame(p.name, p.size, 1, 1, undefined, undefined, Math.min(2, Math.floor(k * 3.4))); ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    // ------------------------------------------------------------------ celebrate / midnight (F-17)
    function celebrate(seconds) {
      const sec = clamp(+seconds || 15, 1, 600);
      fireUntil = T + sec; nextRocket = T;
      const nm = nameForSpeech();
      title = { t: 0, dur: sec, text: nm ? 'З Новим роком, ' + nm + '!' : 'З Новим роком!' };
      speak(title.text);
      emit('celebrate', { seconds: sec });
    }
    function midnight() {
      countdown = { n: 10, t: 0 };
      emit('midnight', {});
    }
    function updateFireworks(dt) {
      if (countdown) {
        countdown.t += dt;
        if (countdown.t >= 1) {
          countdown.t -= 1; countdown.n--;
          if (countdown.n <= 0) { countdown = null; celebrate(60); }
          else sfx('tick');
        }
      }
      if (T < fireUntil && T >= nextRocket && !S.calm) {
        nextRocket = T + rand(0.25, 0.8);
        const sx = rand(W * 0.1, W * 0.9);
        rockets.push({ sx, sy: H + 10, tx: sx + rand(-120, 120), ty: rand(H * 0.12, H * 0.45), t: 0, dur: rand(0.9, 1.4), x: sx, y: H });
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt;
        const p = Math.min(1, r.t / r.dur), e = 1 - (1 - p) * (1 - p);
        r.x = r.sx + (r.tx - r.sx) * e; r.y = r.sy + (r.ty - r.sy) * e;
        part(r.x, r.y, rand(-15, 15), rand(0, 30), 0.6, 1.8, '#ffc266', 0, 60, 0);
        if (p >= 1) {
          const col = pick(FW_COLORS);
          sparkle(r.tx, r.ty, col, 130, 230, 2.0);
          sparkle(r.tx, r.ty, '#ffffff', 40, 100, 1.2);
          sfx('boom');
          rockets.splice(i, 1);
        }
      }
      if (title) { title.t += dt; if (title.t > title.dur) title = null; }
    }
    function drawTitleAndCountdown() {
      if (countdown) {
        const k = countdown.t;
        const s = 1 + k * 0.5, a = 1 - k * 0.85;
        const fs = Math.min(W, H) * 0.32;
        ctx.save();
        ctx.translate(W / 2, H / 2); ctx.scale(s, s);
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.font = '800 ' + fs + 'px ' + UI_FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillText(String(countdown.n), 4, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(countdown.n), 0, 0);
        ctx.restore();
      }
      if (title) {
        const t = title.t, d = title.dur;
        const a = t < 0.6 ? t / 0.6 : t > d - 0.8 ? Math.max(0, (d - t) / 0.8) : 1;
        const s = t < 0.6 ? 0.6 + 0.4 * easeOutBack(t / 0.6) : 1;
        const fs = clamp(W * 0.05, 28, 64);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(W / 2, H * 0.3); ctx.scale(s, s);
        ctx.font = '800 ' + fs + 'px ' + UI_FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const txt = title.text;
        const tw = ctx.measureText(txt).width;
        if (tw > W * 0.9) ctx.font = '800 ' + Math.floor((fs * W * 0.9) / tw) + 'px ' + UI_FONT;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#7a0f1c'; ctx.lineWidth = Math.max(5, fs * 0.14); ctx.strokeText(txt, 0, 0);
        const tg = ctx.createLinearGradient(0, -fs / 2, 0, fs / 2);
        tg.addColorStop(0, '#fff8d6'); tg.addColorStop(0.55, '#ffd34d'); tg.addColorStop(1, '#ffae1a');
        ctx.fillStyle = tg; ctx.fillText(txt, 0, 0);
        const row = ['gift', 'tangerine', 'snowman', 'tangerine', 'gift'];
        const sz = fs * 1.05;
        for (let i = 0; i < row.length; i++) {
          if (!ok(row[i])) continue;
          const c = scaled(row[i], sz, false, i % 3);
          const bob = Math.sin(T * 3 + i) * 4;
          ctx.drawImage(c, (i - (row.length - 1) / 2) * sz * 1.1 - sz / 2, fs * 0.7 + bob, sz, sz);
        }
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------ sound (WebAudio, синтез)
    const audio = { ctx: null, master: null, hum: null };
    function ac() {
      if (!S.sounds) return null;
      if (DEMO && !gestured) return null;
      if (!audio.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return null;
        try {
          audio.ctx = new AC();
          audio.master = audio.ctx.createGain(); audio.master.gain.value = 0.16;
          audio.master.connect(audio.ctx.destination);
        } catch (e) { audio.ctx = null; return null; }
      }
      if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
      return audio.ctx;
    }
    function noiseBuf(a, dur) {
      const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    function env(a, g, t0, atk, peak, dec) {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + dec);
    }
    function tone(a, type, f0, f1, t0, dur, peak) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      env(a, g, t0, 0.01, peak, dur);
      o.connect(g); g.connect(audio.master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise(a, t0, dur, peak, ftype, freq, q) {
      const s = a.createBufferSource(); s.buffer = noiseBuf(a, dur + 0.05);
      const f = a.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q || 1;
      const g = a.createGain(); env(a, g, t0, 0.005, peak, dur);
      s.connect(f); f.connect(g); g.connect(audio.master); s.start(t0); s.stop(t0 + dur + 0.05);
    }
    function sfx(name) {
      const a = ac();
      if (!a) return;
      try {
        const t = a.currentTime + 0.01;
        if (name === 'pop') { tone(a, 'sine', 520, 1100, t, 0.12, 0.5); }
        else if (name === 'crunch') { for (let i = 0; i < 3; i++) noise(a, t + i * 0.07, 0.06, 0.45, 'bandpass', 2400 + i * 400, 1.2); }
        else if (name === 'plop') { tone(a, 'sine', 300, 90, t, 0.22, 0.6); noise(a, t, 0.25, 0.25, 'lowpass', 900); }
        else if (name === 'thud') { noise(a, t, 0.18, 0.5, 'lowpass', 700); tone(a, 'sine', 160, 70, t, 0.15, 0.4); }
        else if (name === 'whoosh') { noise(a, t, 0.3, 0.18, 'bandpass', 1200, 0.7); }
        else if (name === 'honk') { tone(a, 'square', 440, 0, t, 0.13, 0.22); tone(a, 'square', 554, 0, t, 0.13, 0.15); tone(a, 'square', 440, 0, t + 0.2, 0.16, 0.22); tone(a, 'square', 554, 0, t + 0.2, 0.16, 0.15); }
        else if (name === 'hoho') { for (let i = 0; i < 3; i++) { tone(a, 'sawtooth', 150, 120, t + i * 0.28, 0.2, 0.18); tone(a, 'sine', 300, 240, t + i * 0.28, 0.2, 0.2); } }
        else if (name === 'boom') { noise(a, t, 0.5, 0.35, 'lowpass', 400); }
        else if (name === 'tick') { tone(a, 'sine', 880, 0, t, 0.08, 0.25); }
      } catch (e) { /* звук не критичен */ }
    }
    function userIdle() { return lastInputAt && (performance.now() - lastInputAt) / 60000 > S.idleMinutes; }
    function humStart() {
      if (userIdle()) return; // не будим звуком при простое (F-11 AC7)
      const a = ac();
      if (!a || audio.hum) return;
      try {
        const o1 = a.createOscillator(), o2 = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain();
        const f = a.createBiquadFilter(), g = a.createGain();
        o1.type = 'sawtooth'; o1.frequency.value = 52; o2.type = 'square'; o2.frequency.value = 78;
        lfo.frequency.value = 9; lg.gain.value = 6; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
        f.type = 'lowpass'; f.frequency.value = 320; g.gain.value = 0.0001;
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(audio.master);
        o1.start(); o2.start(); lfo.start();
        audio.hum = { o1, o2, lfo, g, f };
      } catch (e) { audio.hum = null; }
    }
    function humLevel(v) {
      const h = audio.hum;
      if (!h || !audio.ctx) return;
      const t = audio.ctx.currentTime;
      h.g.gain.setTargetAtTime(0.0001 + 0.5 * v, t, 0.1);
      h.f.frequency.setTargetAtTime(260 + 260 * v, t, 0.1);
    }
    function humStop(now) {
      const h = audio.hum;
      if (!h) return;
      audio.hum = null;
      try {
        const t = audio.ctx.currentTime;
        h.g.gain.setTargetAtTime(0.0001, t, now ? 0.01 : 0.4);
        const stopAt = t + (now ? 0.05 : 1.6);
        h.o1.stop(stopAt); h.o2.stop(stopAt); h.lfo.stop(stopAt);
      } catch (e) {}
    }

    // ------------------------------------------------------------------ speech
    let voicesReady = false;
    const onVoices = () => { voicesReady = true; };
    if (typeof speechSynthesis !== 'undefined') {
      try {
        speechSynthesis.getVoices();
        if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', onVoices);
      } catch (e) {}
    }
    function speak(text) {
      if (!text || S.voice === false) return;
      if (hostSpeak) { try { hostSpeak(text); } catch (e) {} return; }
      if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
      try {
        // лише український голос; російський як запасний НЕ використовуємо (CR-1)
        const v = findUkVoice(!DEMO);
        if (!v) { warnOnce('voice', 'немає українського голосу — лише бульбашка'); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = v.lang || 'uk-UA';
        u.voice = v;
        u.rate = 0.95; u.pitch = 1.05; u.volume = 1;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch (e) {}
    }

    // ------------------------------------------------------------------ input
    function interactiveTarget(t) {
      if (!t || t === canvas) return false;
      if (t.closest) return !!t.closest('a,button,input,select,textarea,label,[contenteditable],[data-snezhok-ignore]');
      return false;
    }
    function toLocal(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    function onMove(e) {
      const [x, y] = toLocal(e);
      const now = performance.now();
      mouse.x = x; mouse.y = y; mouse.on = x >= -50 && y >= -50 && x <= W + 50 && y <= H + 50;
      mouse.moved = true;
      lastInputAt = now;
    }
    function onDown(e) {
      gestured = true;
      lastInputAt = performance.now();
      const [x, y] = toLocal(e);
      mouse.x = x; mouse.y = y; mouse.on = true;
      if (!running) return;
      const h = hitTest(x, y);
      if (!h) return;
      if (interactiveTarget(e.target)) return;
      clickEntity(h);
    }
    function onPtrUp(e) { if (e && e.pointerType === 'touch') onLeave(); }
    function onLeave() { mouse.on = false; mouse.x = mouse.y = -1e4; }
    function onKey() { lastInputAt = performance.now(); gestured = true; }
    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else if (running && !raf) { lastTs = 0; raf = requestAnimationFrame(frame); }
    }
    function hitTest(x, y) {
      const inside = (hb) => hb.on && x >= hb.x0 && x <= hb.x1 && y >= hb.y0 && y <= hb.y1;
      // мелкие предметы первыми: иначе мандаринку под снеговиком не достать
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (!it.dying && inside(it.hb)) return it; }
      for (let i = actors.length - 1; i >= 0; i--) { const a = actors[i]; if (!a.dead && a.state !== 'broken' && inside(a.hb)) return a; }
      if (convoy && convoy.announce <= 0) for (const v of convoy.veh) if (inside(v.hb)) return v;
      for (const s of sleighs) if (inside(s.hb)) return s;
      return null;
    }
    function clickEntity(h) {
      switch (h.kind) {
        case 'snowman': clickSnowman(h); break;
        case 'penguin': if (h.state === 'walk' || h.state === 'look') startSlide(h, h.dir, rand(330, 420) * U, true); break;
        case 'squirrel': clickSquirrel(h); break;
        case 'sleigh': clickSleigh(h); break;
        case 'snowmobile': clickSnowmobile(h); break;
        default: clickItem(h);
      }
      updateHover(true);
    }
    function updateHover(force) {
      const h = mouse.on ? hitTest(mouse.x, mouse.y) : null;
      hovered = h;
      const st = !!h;
      if (st !== hoverState || force) {
        if (st !== hoverState) {
          hoverState = st;
          if (onHover) { try { onHover(st); } catch (e) {} }
          setCursor(st);
        }
      }
    }
    function setCursor(on) {
      try {
        canvas.style.cursor = on ? 'pointer' : '';
        if (typeof document !== 'undefined' && document.body) {
          const pe = getComputedStyle(canvas).pointerEvents;
          if (pe === 'none') {
            if (on) { cursorOwner = document.body.style.cursor; document.body.style.cursor = 'pointer'; }
            else if (cursorOwner !== null) { document.body.style.cursor = cursorOwner; cursorOwner = null; }
          }
        }
      } catch (e) {}
    }
    function updateMouse(dt) {
      if (mouse.on && mouse.lt) {
        const dx = mouse.x - mouse.lx, dy = mouse.y - mouse.ly;
        const ivx = dx / dt, ivy = dy / dt;
        mouse.vx = mouse.vx * 0.7 + ivx * 0.3; mouse.vy = mouse.vy * 0.7 + ivy * 0.3;
        mouse.speed = mouse.speed * 0.75 + Math.min(Math.hypot(dx, dy) / dt, 5000) * 0.25;
      } else { mouse.vx = mouse.vy = 0; mouse.speed *= 0.8; }
      mouse.lx = mouse.x; mouse.ly = mouse.y; mouse.lt = 1;
    }

    // ------------------------------------------------------------------ main step
    function step(dt) {
      T += dt;
      updateMouse(dt);
      syncWindows(dt);
      const wind = currentWind();

      // снег
      if (S.snow) {
        const inten = S.calm ? 0 : S.intensity; // спокійний режим: не вище «легкого»
        const target = Math.min(1100, Math.floor(W * [0.07, 0.16, 0.42][inten] * (powerSave ? 0.7 : 1)));
        let falling = 0;
        for (let i = 0; i < flakes.length; i++) if (flakes[i].k === 0) falling++;
        let budget = filled ? Math.max(2, Math.ceil(target / 50)) : target;
        while (falling < target && budget-- > 0) { spawnFlake(!filled); falling++; }
        filled = true;
      } else filled = false;

      // планировщик появления
      if (S.tangerines && Math.random() < dt / (S.calm ? 60 : 30)) spawnItem('tangerine');
      // подарунки: не частіше ніж раз на 3 хв; у спокійному режимі — ні
      if (S.surprises && !S.calm && (timers.gift -= dt) <= 0) { timers.gift = DEMO ? rand(30, 60) : rand(180, 300); spawnItem(pick(SURPRISES)); }
      // персонажі: у спокійному режимі — ≤ 1 на екрані і загалом не частіше раз на 3 хв
      const tick = (k, on, fn, a, b) => {
        if (!on) return;
        if ((timers[k] -= dt) > 0) return;
        if (S.calm && (calmBusy() || T < calmNextAt)) { timers[k] = rand(8, 20); return; }
        timers[k] = rand(a, b);
        if (fn() && S.calm) calmNextAt = T + 180;
      };
      tick('snowman', S.snowmen, spawnSnowman, DEMO ? 14 : 60, DEMO ? 30 : 120);
      tick('penguin', S.penguins, () => spawnPenguin(), DEMO ? 18 : 90, DEMO ? 35 : 150);
      tick('squirrel', S.squirrels, spawnSquirrel, DEMO ? 18 : 90, DEMO ? 38 : 180);
      if (!S.calm) tick('sleigh', S.sleigh, spawnSleigh, DEMO ? 120 : 600, DEMO ? 180 : 900);
      if (S.snowmobiles && !convoy) {
        const every = DEMO ? (S.snowmobileEvery === 60 ? 120 : 60) : S.snowmobileEvery * 60;
        if (T - snowmobileRef >= every) { snowmobileRef = T; if (greeter) snowmobilePending = true; else startConvoy(); }
      }

      // снежинки
      const R = 110, push = 650 + Math.min(mouse.speed, 3000) * 0.9;
      const mOn = S.cursor && mouse.on;
      const swirl = false; // кружляння снігу прибрано (CR-5), лишилось просте відштовхування
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i];
        if (mOn) {
          const dx = f.x - mouse.x, dy = f.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2), k = (1 - d / R) * push;
            f.vx += (dx / d) * k * dt; f.vy += (dy / d) * k * dt;
            if (swirl) { const s = (1 - d / R) * 900 * Math.sign(mouse.vx || 1); f.vx += (-dy / d) * s * dt; f.vy += (dx / d) * s * dt; }
          }
        }
        const tvx = wind * (0.35 + 0.65 * f.d);
        if (f.k === 0) {
          const relax = Math.min(1, dt * 1.6);
          f.vx += (tvx - f.vx) * relax; f.vy += (f.base - f.vy) * relax;
        } else {
          f.vx += (tvx * 0.5 - f.vx) * Math.min(1, dt * 0.6);
          f.vy = Math.min(f.vy + 420 * dt, f.base);
        }
        const sway = f.k === 1 ? 0 : f.sway * Math.sin(T * f.freq + f.ph);
        const prevY = f.y;
        f.x += (f.vx + sway) * dt; f.y += f.vy * dt; f.rot += f.spin * dt;
        if (f.x < -40) f.x += W + 80; else if (f.x > W + 40) f.x -= W + 80;
        if (f.y < -90) { f.y = -90; if (f.vy < 0) f.vy = 0; }
        let remove = false;
        if (f.k === 0 && f.canLand && S.windowCaps && wins.length) {
          for (let idx = 0; idx < wins.length; idx++) {
            const w = wins[idx];
            if (!w.landable || f.x <= w.x + 2 || f.x >= w.r - 2) continue;
            const cap = caps.get(w.id);
            if (!cap) continue;
            const k = Math.floor((f.x - w.x) / BIN);
            const top = w.y - (cap.depth[k] || 0);
            if (prevY <= top && f.y > top) {
              if (!occluded(f.x, w.y - 1, idx)) {
                const a = f.r * 0.45, n = cap.depth.length;
                if (k >= 0 && k < n) cap.depth[k] = Math.min(capLimit(n, k), cap.depth[k] + a * 0.5);
                if (k - 1 >= 0) cap.depth[k - 1] = Math.min(capLimit(n, k - 1), cap.depth[k - 1] + a * 0.25);
                if (k + 1 < n) cap.depth[k + 1] = Math.min(capLimit(n, k + 1), cap.depth[k + 1] + a * 0.25);
                remove = true;
              }
              break;
            }
          }
        }
        if (!remove) {
          const g = groundY(f.x);
          if (S.drifts && f.y >= g - 0.5 && f.x >= 0 && f.x <= W) {
            if (!(convoy && plowed[Math.floor(f.x / BIN)])) depositDrift(f.x, f.k === 1 ? 1.1 : f.r * 0.22);
            remove = true;
          } else if (f.y > H + 20) remove = true;
        }
        if (remove) removeFlake(i);
      }

      // таяние (F-01 AC4: ≤ 60 с), сугробы выключены — быстро
      driftPeak = 0;
      const melt = !S.drifts ? dt * 40 : !S.snow ? dt * Math.max(1, H * 0.12 / 50) : 0;
      for (let k = 0; k < drift.length; k++) {
        if (melt && drift[k] > 0) drift[k] = Math.max(0, drift[k] - melt);
        if (drift[k] > driftPeak) driftPeak = drift[k];
      }
      if (!S.snow) for (const cap of caps.values()) for (let k = 0; k < cap.depth.length; k++) cap.depth[k] = Math.max(0, cap.depth[k] - dt * 0.3);

      // следы
      const coverRate = S.snow ? 1 + S.intensity * 0.6 : 1;
      for (let i = prints.length - 1; i >= 0; i--) {
        const p = prints[i];
        p.age += dt * coverRate;
        if (p.age > p.life || Math.abs(driftH(p.x) - p.gh) > 9) prints.splice(i, 1);
      }
      // закопанное со временем пропадает
      for (let i = buried.length - 1; i >= 0; i--) if (T - buried[i].t > 300) buried.splice(i, 1);

      // персонажи
      for (let i = actors.length - 1; i >= 0; i--) {
        const a = actors[i];
        if (a.kind === 'snowman') updateSnowman(a, dt);
        else if (a.kind === 'penguin') updatePenguin(a, dt);
        else if (a.kind === 'squirrel') updateSquirrel(a, dt);
        // выключили в настройках — тихо исчезают
        const off = (a.kind === 'snowman' && !S.snowmen) || (a.kind === 'penguin' && !S.penguins) || (a.kind === 'squirrel' && !S.squirrels);
        if (off) { a.alpha -= dt * 2; if (a.alpha <= 0) a.dead = true; }
        if (a.dead) { if (a.carry) a.carry = null; actors.splice(i, 1); }
      }
      updatePieces(dt);
      updateItems(dt, wind);
      updateSleighs(dt);
      updateConvoy(dt);
      updateBalls(dt);
      updateGreeter(dt);
      updateFireworks(dt);

      // частицы
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { if (p.plow) { p.plow = 0; plowAlive--; } parts[i] = parts[parts.length - 1]; parts.pop(); partPool.push(p); continue; }
        p.vy += p.g * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        if (p.type === 1 && p.vy > 0 && p.y > groundY(p.x) + 2) { p.life = Math.min(p.life, 0.12); p.vy = 0; p.vx *= 0.3; }
      }
    }

    // ------------------------------------------------------------------ drawing
    let garLayer = null, garKey = '';
    // наведення курсора/пальця: світиться лише лампочка під ним, світіння плавно наростає й гасне
    const GAR_COLORS = ['#e2454f', '#f0b43c', '#4fb56a', '#4a8ed6', '#d878b4'];
    const GAR_BW = 15, GAR_SOCK = 7, GAR_GH = 22, GAR_PAD = 4;
    const GAR_W = GAR_BW + GAR_PAD * 2, GAR_H = GAR_SOCK + GAR_GH + GAR_PAD * 2;
    const garSpr = new Map();
    let garGlow = null, garGl = null, garLastT = 0;
    function garMix(hex, to, t) {
      const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      return 'rgb(' + Math.round(r + (to - r) * t) + ',' + Math.round(g + (to - g) * t) + ',' + Math.round(b + (to - b) * t) + ')';
    }
    function garlandPoints() {
      const y0 = topInset + 1, sag = 12;
      const segs = Math.max(1, Math.ceil(W / 190)), segW = W / segs;
      const py = (x) => y0 + sag * Math.sin(Math.PI * ((x % segW) / segW));
      const slope = (x) => sag * Math.PI / segW * Math.cos(Math.PI * ((x % segW) / segW));
      const n = Math.max(1, Math.round((W - 40) / 80));
      return { py, slope, y0, sag, segW, n, bx: (i) => (W * (i + 0.5)) / n };
    }
    function garlandHitIndex(x, y) {
      if (!S.garland) return -1;
      const { py, n, bx } = garlandPoints();
      for (let i = 0; i < n; i++) {
        const cx = bx(i), top = py(cx) - 4;
        if (Math.abs(x - cx) <= GAR_BW * 0.8 + 4 && y >= top && y <= top + GAR_SOCK + GAR_GH + 8) return i;
      }
      return -1;
    }
    /** Спрайт лампочки (колір ci, горить/ні): цоколь з гранями + скляна крапля з градієнтом і відблиском. Якір — (GAR_W/2, GAR_PAD). */
    function garBulb(ci, lit) {
      const key = ci + (lit ? 'L' : 'D') + DPR;
      let c = garSpr.get(key);
      if (c) return c;
      c = makeCanvas(Math.round(GAR_W * DPR), Math.round(GAR_H * DPR));
      const g = c.getContext('2d');
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.translate(GAR_W / 2, GAR_PAD);
      const col = GAR_COLORS[ci], gy = GAR_SOCK - 1, cy = gy + GAR_GH * 0.58;
      g.beginPath();
      g.moveTo(-3, gy);
      g.bezierCurveTo(-GAR_BW / 2 - 1, gy + GAR_GH * 0.2, -GAR_BW / 2 - 0.5, gy + GAR_GH * 0.92, 0, gy + GAR_GH);
      g.bezierCurveTo(GAR_BW / 2 + 0.5, gy + GAR_GH * 0.92, GAR_BW / 2 + 1, gy + GAR_GH * 0.2, 3, gy);
      g.closePath();
      const gr = g.createRadialGradient(0, cy, 0.5, 0, cy, GAR_BW * 0.8);
      if (lit) {
        gr.addColorStop(0, '#fffaf0'); gr.addColorStop(0.22, garMix(col, 255, 0.55));
        gr.addColorStop(0.6, col); gr.addColorStop(1, garMix(col, 0, 0.3));
      } else {
        gr.addColorStop(0, garMix(col, 255, 0.12)); gr.addColorStop(0.55, garMix(col, 0, 0.42)); gr.addColorStop(1, garMix(col, 0, 0.68));
      }
      g.fillStyle = gr; g.fill();
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(0,0,0,.28)'; g.stroke();
      if (lit) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-0.6, cy - 4); g.lineTo(0, cy + 2); g.lineTo(0.8, cy - 4); g.stroke(); }
      g.fillStyle = lit ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.42)';
      g.beginPath(); g.ellipse(-GAR_BW * 0.22, gy + GAR_GH * 0.36, 1.6, 4.2, -0.2, 0, 6.2832); g.fill();
      g.beginPath(); g.arc(-GAR_BW * 0.12, gy + GAR_GH * 0.7, 0.9, 0, 6.2832); g.fill();
      // цоколь: темний, з гранями
      g.fillStyle = '#26382c'; g.fillRect(-3.6, 0, 7.2, GAR_SOCK);
      g.fillStyle = '#3d5646'; g.fillRect(-3.6, 0, 1.8, GAR_SOCK);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(1.8, 0, 1.8, GAR_SOCK);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-3.6, 2.3, 7.2, 0.7); g.fillRect(-3.6, 4.6, 7.2, 0.7);
      garSpr.set(key, c);
      return c;
    }
    function garDraw(g, ci, lit, x, y, ang, sc) {
      g.save();
      g.translate(x, y); g.rotate(ang);
      if (sc !== 1) g.scale(sc, sc);
      g.drawImage(garBulb(ci, lit), -GAR_W / 2, -GAR_PAD, GAR_W, GAR_H);
      g.restore();
    }
    function garAngle(i, x, slope) { return Math.atan(slope(x)) * 0.5 + Math.sin(i * 7.3) * 0.1; }
    function garGlowImg(ci) {
      if (!garGlow) garGlow = GAR_COLORS.map((c) => radialSprite(64, [[0, c], [0.35, c + '88'], [1, 'rgba(0,0,0,0)']]));
      return garGlow[ci];
    }
    function drawGarland() {
      if (!S.garland) return;
      const { py, slope, segW, n, bx } = garlandPoints();
      const lh = topInset + 12 + GAR_SOCK + GAR_GH + 22;
      const key = W + 'x' + lh + '@' + DPR + (S.calm ? 'c' : '');
      if (key !== garKey) {
        garKey = key; garSpr.clear();
        if (!garLayer) garLayer = makeCanvas(1, 1);
        garLayer.width = Math.round(W * DPR); garLayer.height = Math.round(lh * DPR);
        const g = garLayer.getContext('2d');
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
        g.lineCap = 'round';
        const path = () => { g.beginPath(); for (let x = 0; x <= W; x += 4) x ? g.lineTo(x, py(x)) : g.moveTo(x, py(x)); };
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3.4; g.save(); g.translate(0, 1.2); path(); g.stroke(); g.restore();
        g.strokeStyle = '#1b3826'; g.lineWidth = 2.6; path(); g.stroke();
        g.strokeStyle = '#3f7a50'; g.lineWidth = 1.2; g.setLineDash([2.6, 2.6]); path(); g.stroke();
        g.strokeStyle = '#102418'; g.lineDashOffset = 2.6; path(); g.stroke();
        g.setLineDash([]); g.lineDashOffset = 0;
        for (let k = 0; k * segW <= W + 1; k++) {
          const hx = Math.min(W - 1, k * segW), hy = py(hx);
          g.fillStyle = '#9aa7a0'; g.beginPath(); g.arc(hx, hy, 2.4, 0, 6.2832); g.fill();
          g.fillStyle = '#e6ece8'; g.beginPath(); g.arc(hx - 0.6, hy - 0.6, 0.9, 0, 6.2832); g.fill();
        }
        for (let i = 0; i < n; i++) {
          const x = bx(i);
          // у спокійному режимі гірлянда статична: половина лампочок світиться рівно
          const lit = S.calm && i % 2 === 0;
          garDraw(g, i % 5, lit, x, py(x), garAngle(i, x, slope), 1);
          if (lit) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4; g.drawImage(garGlowImg(i % 5), x - 20, py(x) + GAR_SOCK + GAR_GH * 0.55 - 20, 40, 40); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
        }
      }
      ctx.drawImage(garLayer, 0, 0, W, lh);
      if (!garGl || garGl.length !== n) garGl = new Float32Array(n);
      const dt = Math.min(0.1, Math.max(0, T - garLastT)); garLastT = T;
      const hov = mouse.on ? garlandHitIndex(mouse.x, mouse.y) : -1;
      let any = false;
      for (let i = 0; i < n; i++) {
        const v = garGl[i];
        garGl[i] = i === hov ? Math.min(1, v + dt / 0.18) : Math.max(0, v - dt / 0.9);
        if (garGl[i] > 0.004) any = true;
      }
      if (S.calm && !any) return;
      for (let i = 0; i < n; i++) {
        const x = bx(i), a = Math.max(S.calm ? 0 : 0.5 + 0.5 * Math.sin(T * 0.55 + i * 2.39), garGl[i]);
        if (a < 0.06) continue;
        ctx.globalAlpha = a;
        garDraw(ctx, i % 5, true, x, py(x), garAngle(i, x, slope), S.calm ? 1 : 1 + 0.14 * garGl[i]);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = bx(i), h = garGl[i];
        const a = Math.max(S.calm ? 0 : (0.5 + 0.5 * Math.sin(T * 0.55 + i * 2.39)) * 0.5, h * 0.95);
        if (a < 0.03) continue;
        const sz = 40 + (S.calm ? 0 : 26) * h;
        ctx.globalAlpha = a;
        ctx.drawImage(garGlowImg(i % 5), x - sz / 2, py(x) + GAR_SOCK + GAR_GH * 0.55 - sz / 2, sz, sz);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    let capGrad = null, capGradH = 0;
    function drawCaps() {
      if (!S.windowCaps && !caps.size) return;
      for (const w of wins) {
        if (!w.landable) continue;
        const cap = caps.get(w.id);
        if (!cap) continue;
        const n = cap.depth.length;
        let s = -1;
        for (let k = 0; k <= n; k++) {
          const vis = k < n && cap.depth[k] > 0.35 && !occluded(w.x + (k + 0.5) * BIN, w.y - 1, w.idx);
          if (vis) { if (s < 0) s = k; }
          else if (s >= 0) { capRun(w, cap, s, k - 1); s = -1; }
        }
      }
    }
    function capRun(w, cap, a, b) {
      const n = cap.depth.length, d = cap.depth;
      const x0 = w.x + a * BIN, x1 = Math.min(w.r, w.x + (b + 1) * BIN);
      const atL = a === 0, atR = b === n - 1;
      const top = w.y;
      // мягкая тень на окне
      ctx.fillStyle = 'rgba(20,40,90,.16)';
      ctx.fillRect(x0, top, x1 - x0, 2.5);
      ctx.beginPath();
      const ovL = atL ? Math.min(4, d[0] * 0.5 + 1) : 0, ovR = atR ? Math.min(4, d[n - 1] * 0.5 + 1) : 0;
      ctx.moveTo(x0 - ovL, top + (atL ? Math.min(5, d[a] * 0.45) : 0));
      if (atL) ctx.quadraticCurveTo(x0 - ovL - 1, top - d[a] * 0.6, x0 + 2, top - d[a] * 0.85);
      else ctx.lineTo(x0, top - d[a]);
      for (let k = a; k <= b; k++) {
        const xm = Math.min(w.r, w.x + (k + 0.5) * BIN);
        const xn = Math.min(w.r, w.x + (k + 1) * BIN);
        const dn = k + 1 <= b ? d[k + 1] : d[k];
        ctx.quadraticCurveTo(xm, top - d[k], (xm + Math.min(w.r, xn + BIN * 0.5)) / 2, top - (d[k] + dn) / 2);
      }
      if (atR) ctx.quadraticCurveTo(x1 + ovR + 1, top - d[b] * 0.6, x1 + ovR, top + Math.min(5, d[b] * 0.45));
      else ctx.lineTo(x1, top);
      ctx.lineTo(x1, top + 0.5); ctx.lineTo(x0, top + 0.5);
      ctx.closePath();
      ctx.fillStyle = '#f5f8ff'; ctx.fill();
      ctx.strokeStyle = 'rgba(170,198,240,.85)'; ctx.lineWidth = 1; ctx.stroke();
    }
    let driftGrad = null, driftGradKey = '';
    function drawDrift() {
      if (driftPeak < 0.3) return;
      const by = baseY();
      ctx.beginPath();
      ctx.moveTo(0, H + 5); ctx.lineTo(0, by - drift[0]);
      for (let k = 0; k < drift.length - 1; k++) {
        const x0 = k * BIN, x1 = (k + 1) * BIN;
        ctx.quadraticCurveTo(x0, by - drift[k], (x0 + x1) / 2, by - (drift[k] + drift[k + 1]) / 2);
      }
      ctx.lineTo(W, by - drift[drift.length - 1]); ctx.lineTo(W, H + 5); ctx.closePath();
      const key = H + '|' + Math.round(driftPeak / 4);
      if (key !== driftGradKey) {
        driftGradKey = key;
        driftGrad = ctx.createLinearGradient(0, by - driftPeak, 0, H);
        driftGrad.addColorStop(0, '#ffffff'); driftGrad.addColorStop(0.35, '#f4f8ff'); driftGrad.addColorStop(1, '#d4e1f5');
      }
      ctx.fillStyle = driftGrad; ctx.fill();
      ctx.strokeStyle = 'rgba(176,202,245,.95)'; ctx.lineWidth = 1.4; ctx.stroke();
      // блик по гребню
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let k = 0; k < drift.length; k += 2) {
        if (drift[k] < 4) { started = false; continue; }
        const x = k * BIN, y = by - drift[k] + 3;
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    let driftLayer = null, driftDrawnAt = -1, driftLayerKey = '';
    function driftBand() { return Math.ceil(H * 0.12 + bottomInset + 16); }
    function drawDriftLayer() {
      if (driftPeak < 0.3 && !prints.length) return;
      const bh = driftBand();
      const key = W + 'x' + H + '@' + DPR;
      if (!driftLayer) driftLayer = makeCanvas(1, 1);
      if (key !== driftLayerKey) { driftLayer.width = Math.round(W * DPR); driftLayer.height = Math.round(bh * DPR); driftLayerKey = key; driftDrawnAt = -1; }
      const every = convoy ? 0.05 : 0.2;
      if (driftDrawnAt < 0 || T - driftDrawnAt >= every || T < driftDrawnAt) {
        const g = driftLayer.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, driftLayer.width, driftLayer.height);
        g.setTransform(DPR, 0, 0, DPR, 0, -(H - bh) * DPR);
        ctx = g;
        try { drawDrift(); drawPrints(); } finally { ctx = mainCtx; }
        driftDrawnAt = T;
      }
      ctx.drawImage(driftLayer, 0, H - bh, W, bh);
    }
    function drawPrints() {
      if (!prints.length) return;
      const by = baseY();
      for (const p of prints) {
        const a = (1 - p.age / p.life) * clamp(driftH(p.x) / 6, 0, 1);
        if (a <= 0.02) continue;
        const y = by - driftH(p.x);
        ctx.globalAlpha = a;
        if (p.k === 0) {         // лапки пингвина — пара трёхпалых отпечатков
          ctx.fillStyle = 'rgba(105,135,190,.55)';
          const ox = p.side * 3 * U;
          ctx.beginPath(); ctx.ellipse(p.x + ox, y + 3 + (p.side > 0 ? 1.5 : 0), 3.4 * U, 1.3 * U, 0, 0, TAU); ctx.fill();
        } else if (p.k === 1) {  // белка — мелкие парные
          ctx.fillStyle = 'rgba(105,135,190,.5)';
          ctx.beginPath(); ctx.ellipse(p.x - 2, y + 2.5, 1.5, 0.9, 0, 0, TAU); ctx.ellipse(p.x + 2, y + 3.2, 1.5, 0.9, 0, 0, TAU); ctx.fill();
        } else if (p.k === 2) {  // борозда снеговика
          ctx.fillStyle = 'rgba(120,150,205,.32)';
          ctx.fillRect(p.x - 3.5, y + 1.5, 7, 3.2 * U);
        } else if (p.k === 3) {  // колея снегохода
          ctx.fillStyle = 'rgba(95,120,170,.42)';
          ctx.fillRect(p.x - 4.5, y + 2, 9, 2.2);
          ctx.fillRect(p.x - 4.5, y + 6, 9, 2.2);
        } else if (p.k === 4) {  // скольжение на животе
          ctx.fillStyle = 'rgba(120,150,205,.3)';
          ctx.fillRect(p.x - 4, y + 1, 8, 4 * U);
        }
      }
      ctx.globalAlpha = 1;
    }
    // атлас пластівців: FL_SIZES розмірів × FL_ALPHAS прозоростей, уже під DPR — малюємо 1:1 без зміни стану
    const FL_SIZES = 11, FL_ALPHAS = 4;
    let flAtlas = null, flAtlasDpr = 0;
    function buildFlakeAtlas() {
      flAtlas = [];
      for (let si = 0; si < FL_SIZES; si++) {
        const r = 1.1 + si * 0.4, css = r * 2.6, px = Math.max(2, Math.round(css * DPR));
        const row = [];
        for (let ai = 0; ai < FL_ALPHAS; ai++) {
          const c = makeCanvas(px, px), g = c.getContext('2d');
          g.globalAlpha = 0.45 + (0.55 * ai) / (FL_ALPHAS - 1);
          g.drawImage(dotImg, 0, 0, px, px);
          row.push(c);
        }
        flAtlas.push({ css: px / DPR, row });
      }
      flAtlasDpr = DPR;
    }
    function drawFlakes(near) {
      if (!flAtlas || flAtlasDpr !== DPR) buildFlakeAtlas();
      const q = DPR;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        if ((f.d >= 0.45) !== near) continue;
        const a = flAtlas[f.si], s = a.css;
        ctx.drawImage(a.row[f.ai], Math.round((f.x - s / 2) * q) / q, Math.round((f.y - s / 2) * q) / q, s, s);
      }
    }
    function drawParticles() {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.type === 0) continue;
        const a = clamp(p.life / p.max, 0, 1);
        if (p.type === 1) {
          ctx.globalAlpha = Math.min(1, a * 1.5);
          const s = p.size * 2.6;
          ctx.drawImage(dotImg, p.x - s / 2, p.y - s / 2, s, s);
        } else if (p.type === 2) {
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.fillStyle = p.color;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillRect(-p.size, -p.size * 0.55, p.size * 2, p.size * 1.1);
          ctx.restore();
        } else if (p.type === 3) {
          ctx.globalAlpha = a * 0.55;
          const s = p.size * (2.5 - a * 1.2) * 2;
          ctx.drawImage(puffImg, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.type !== 0) continue;
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = p.color;
        if (p.size < 2) ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    function drawActors() {
      for (const a of actors) {
        if (a.kind === 'snowman') {
          if (a.state === 'broken') { a.hb.on = false; continue; }
          drawSnowman(a, a.x, a.y, a.size);
        } else if (a.kind === 'penguin') {
          drawActorSprite(a, 'penguin', a.y);
        } else if (a.kind === 'squirrel') {
          let surf = a.y;
          if (a.air) { surf = surfaceBelow(a.x, a.y, true).y; a.lift = surf - a.y; }
          // кадр анімації: біг (за фазою стрибка), політ, сидить-гризе
          let sheetName = 'sqRun';
          if (a.state === 'jump' || a.state === 'fall') { sheetName = 'sqJump'; a.fi = clamp(Math.round(((a.vy + 600) / 1200) * 4) + 1, 1, 5); if (a.st < 0.06) a.fi = 0; }
          else if (a.state === 'sit' || a.state === 'eat') { sheetName = 'sqSit'; a.fi = Math.floor(a.st * 6) % 6; }
          else if (a.state === 'dig') a.fi = 0;
          else a.fi = Math.floor(a.hp * 8) % 8;
          drawActorSprite(a, sheetName, surf);
          if (a.air) a.lift = 0;
          // несе мандаринку в зубах
          if (a.carry && a.state !== 'sit' && ok(a.carry.kind)) {
            const fdir = a.face >= 0 ? 1 : -1;
            const sz = a.size * 0.3;
            const px = a.x + fdir * a.size * 0.4, py = a.y - (a.lift || 0) - a.size * 0.26;
            const c = scaled(a.carry.kind, sz, false, a.carry.v || 0);
            ctx.drawImage(c, px - sz / 2, py - sz / 2, sz, sz);
          }
        }
      }
    }
    function draw(dt) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawGarland();
      for (const r of rockets) { ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, TAU); ctx.fill(); }
      for (const s of sleighs) drawSleigh(s);
      drawFlakes(false);
      drawCaps();
      drawDriftLayer();
      for (const it of items) drawItem(it);
      drawActors();
      drawPieces();
      drawConvoy();
      drawGreeter();
      drawBalls();
      drawFlakes(true);
      drawParticles();
      drawBubbles(dt);
      drawTitleAndCountdown();
    }

    function calm() {
      return !actors.length && !items.length && !sleighs.length && !convoy && !greeter && !parts.length && !rockets.length && !balls.length && !countdown && !title && !pieces.length && !bubbles.length && !pops.length;
    }
    function frame(ts) {
      raf = 0;
      if (!running || destroyed) return;
      raf = requestAnimationFrame(frame);
      if (!lastTs) { lastTs = ts; lastRender = ts; }
      if (dprCap() !== DPR) resize();
      // справжнє пропускання кадрів: на пропущених нічого не рахуємо і не малюємо
      let fps = targetFps;
      if (powerSave) fps = Math.min(fps, 20);
      if (calm()) fps = Math.min(fps, 30);
      if (ts - lastRender < 1000 / fps - 2) return;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts; lastRender = ts;
      if (dt <= 0) return;
      const t0 = performance.now();
      try {
        step(dt);
        updateHover(false);
        draw(dt);
      } catch (e) {
        warnOnce('frame', 'помилка кадру: ' + (e && e.message));
        if (typeof console !== 'undefined') console.warn(e);
      }
      frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
    }

    // ------------------------------------------------------------------ lifecycle
    function pause() {
      if (destroyed || !running) return;
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      humStop(true);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (hoverState) { hoverState = false; if (onHover) { try { onHover(false); } catch (e) {} } setCursor(false); }
    }
    function resume() {
      if (destroyed || running) return;
      running = true; lastTs = 0;
      if (typeof document === 'undefined' || !document.hidden) raf = requestAnimationFrame(frame);
    }
    function destroy() {
      if (destroyed) return;
      pause();
      destroyed = true;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onPtrUp);
      window.removeEventListener('pointercancel', onPtrUp);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      if (typeof document !== 'undefined') {
        document.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('visibilitychange', onVis);
      }
      if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
      try {
        if (typeof speechSynthesis !== 'undefined') {
          if (speechSynthesis.removeEventListener) speechSynthesis.removeEventListener('voiceschanged', onVoices);
          if (!hostSpeak) speechSynthesis.cancel();
        }
      } catch (e) {}
      try { if (audio.ctx) audio.ctx.close(); } catch (e) {}
      cache.clear(); ballCache.clear();
      flakes.length = parts.length = actors.length = items.length = pieces.length = sleighs.length = 0;
      convoy = null; greeter = null;
    }

    // init
    resize();
    // стартовые сугробы и шапки, чтобы сразу было видно
    for (let k = 0; k < drift.length; k++) drift[k] = driftMax[k] * (DEMO ? 0.6 : 0.25);
    driftPeak = 1;
    snowmobileRef = DEMO ? -40 : 0; // в demo первая колонна через ~20 с
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onPtrUp, { passive: true });
    window.addEventListener('pointercancel', onPtrUp, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey, { passive: true });
    if (typeof document !== 'undefined') {
      document.addEventListener('mouseleave', onLeave);
      document.addEventListener('visibilitychange', onVis);
    }
    if (typeof ResizeObserver !== 'undefined') { try { ro = new ResizeObserver(() => resize()); ro.observe(canvas); } catch (e) { ro = null; } }
    // в demo: шапки на окнах сразу немного заснежены
    if (DEMO) { syncWindows(0); for (const [id, cap] of caps) for (let k = 0; k < cap.depth.length; k++) cap.depth[k] = capLimit(cap.depth.length, k) * 0.45; }
    inited = true;
    resume();

    const api = {
      setSettings(p) { if (!destroyed) applySettings(p); },
      setUser(u) { if (!destroyed) setUser(u); },
      setPhrases(a) { if (!destroyed) setPhrases(a); },
      greet(text, gopts) { if (!destroyed) greet(text, gopts && typeof gopts === 'object' ? gopts : null); },
      /** Энергосбережение (от батареи): ~30 fps и на 30 % меньше снежинок. */
      setPowerSave(on) { powerSave = !!on; resize(); },
      /** Частота кадрів (10–60). За замовчуванням 30 в overlay, 60 у demo. */
      setFrameRate(fps) { const n = +fps; if (isFinite(n)) targetFps = clamp(Math.round(n), 10, 60); },
      callSnowmobile() { if (!destroyed) callSnowmobile(); },
      spawn(kind) {
        if (destroyed) return false;
        switch (kind) {
          case 'snowman': return !!spawnSnowman();
          case 'penguin': return !!spawnPenguin();
          case 'squirrel': return !!spawnSquirrel();
          case 'sleigh': case 'santa': return !!spawnSleigh();
          case 'snowmobile': callSnowmobile(); return true;
          default:
            if (SPR[kind] && ['tangerine', 'gift', 'nut'].indexOf(kind) >= 0) return !!spawnItem(kind);
            return false;
        }
      },
      celebrate(seconds) { if (!destroyed) celebrate(seconds); },
      midnight() { if (!destroyed) midnight(); },
      clearSnow() {
        if (destroyed) return;
        drift.fill(0); for (const c of caps.values()) c.depth.fill(0); prints.length = 0; buried.length = 0;
        for (let i = flakes.length - 1; i >= 0; i--) if (flakes[i].k === 1) removeFlake(i);
      },
      throwSnowball(x, y) { if (!destroyed) throwSnowball(x, y); },
      /** Індекс лампочки гірлянди під точкою (локальні координати) або -1. */
      hitGarland(x, y) { return destroyed ? -1 : garlandHitIndex(x, y); },
      setStats(s) { if (!destroyed) setStats(s); },
      pause, resume, destroy,
      /** Диагностика (не часть контракта): состояние для тестов. */
      debug() {
        return {
          running, W, H, DPR, T, fps: targetFps, frameMs: Math.round(frameMs * 100) / 100, flakes: flakes.length, particles: parts.length, prints: prints.length,
          sprites: spritesLoaded, windows: wins.length, caps: caps.size, driftPeak,
          actors: actors.map((a) => ({ kind: a.kind, state: a.state, x: a.x, y: a.y, chick: !!a.chick, hb: Object.assign({}, a.hb) })),
          items: items.map((i) => ({ kind: i.kind, x: i.x, y: i.y, resting: i.resting, hb: Object.assign({}, i.hb) })),
          sleighs: sleighs.map((s) => ({ x: s.x, y: s.y, hb: Object.assign({}, s.hb) })),
          convoy: convoy ? { announce: convoy.announce, veh: convoy.veh.map((v) => ({ x: v.x, y: v.y, hb: Object.assign({}, v.hb) })) } : null,
          greeting: greeter ? greeter.text : null, hovered: hoverState, hoverKind: hovered ? hovered.kind : null, mouse: { x: mouse.x, y: mouse.y, speed: mouse.speed }, stats: Object.assign({}, stats), settings: Object.assign({}, S),
        };
      },
    };
    return api;
  }

  // длина корпуса снегохода (метод на объекте машины)
  // (объявлено здесь, чтобы не создавать замыкание на каждый кадр)
  return { createEngine, version: VERSION, DEFAULT_SETTINGS, DEFAULT_PHRASES, WISHES, formatPhrase, daysText, daysUntilNewYear, plural, hasVoice, voiceInfo };
});
