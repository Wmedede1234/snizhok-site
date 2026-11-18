/* Сніжок — інтерактивні ефекти лендингу (L-12, L-13, L-15, L-17 з docs/LANDING_PLAN.md).
   Без бібліотек і мережі. prefers-reduced-motion → нічого не рухається. */
(function () {
  'use strict';
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finePointer = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);
  if (reduce) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Зорі, що мерехтять (L-15) ---------- */
  var hero = $('.hero');
  if (hero) {
    var sky = document.createElement('div');
    sky.className = 'stars'; sky.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 22; i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 62).toFixed(2) + '%';
      s.style.setProperty('--z', (0.4 + Math.random() * 0.6).toFixed(2));
      s.style.setProperty('--d', (2.8 + Math.random() * 3.4).toFixed(2) + 's');
      s.style.setProperty('--dl', (-Math.random() * 6).toFixed(2) + 's');
      sky.appendChild(s);
    }
    hero.insertBefore(sky, hero.firstChild);
  }

  /* ---------- Паралакс першого екрана й 3D-місяць за курсором (L-15, L-17) ---------- */
  if (hero && finePointer) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var tick = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty('--px', cx.toFixed(3));
      hero.style.setProperty('--py', cy.toFixed(3));
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', function (e) {
      if (window.scrollY > hero.offsetHeight) return;
      tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- Мешканці: 3D-нахил за курсором і стрибок (L-16, тимчасово CSS 3D) ---------- */
  if (finePointer) {
    $$('.who__art').forEach(function (art) {
      art.addEventListener('pointermove', function (e) {
        var r = art.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        if (!art.classList.contains('has-yaw')) art.style.setProperty('--ry', (x * 22).toFixed(1) + 'deg');
        art.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg');
      });
      art.addEventListener('pointerenter', function () { art.classList.add('is-hover'); });
      art.addEventListener('pointerleave', function () {
        art.classList.remove('is-hover'); art.style.setProperty('--ry', '0deg'); art.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Білочка: справжні 3D-ракурси за курсором (L-16) ---------- */
  var resSec = $('#residents');
  var sqArt = resSec && $('img[src="img/squirrel.webp"]', resSec);
  sqArt = sqArt && sqArt.parentNode;
  if (finePointer && sqArt && 'IntersectionObserver' in window) {
    var FRAMES = 7, YAW_STRIP = 'img/squirrel-yaw.webp';
    var yawEl = null, yawIdx = -1, yawRaf = 0, yawX = 0, yawListen = false;
    var yawFrame = function () {
      yawRaf = 0;
      var s = resSec.getBoundingClientRect(), a = sqArt.getBoundingClientRect();
      var cx = a.left + a.width / 2;
      var span = yawX < cx ? cx - s.left : s.right - cx;
      var k = span > 1 ? Math.max(-1, Math.min(1, (yawX - cx) / span)) : 0;
      // кадри 6…2 (+45°…−15°): білочка завжди лишається мордочкою до глядача, не відвертається
      var idx = Math.round(4 - k * 2);
      if (idx === yawIdx) return;
      yawIdx = idx;
      yawEl.style.backgroundPosition = (idx * 100 / (FRAMES - 1)).toFixed(3) + '% 0';
      yawEl.dataset.frame = String(idx);
    };
    var yawMove = function (e) {
      yawX = e.clientX;
      if (!yawRaf) yawRaf = requestAnimationFrame(yawFrame);
    };
    var yawSet = function (on) {
      if (on === yawListen) return;
      yawListen = on;
      if (on) document.addEventListener('pointermove', yawMove, { passive: true });
      else { document.removeEventListener('pointermove', yawMove); if (yawRaf) { cancelAnimationFrame(yawRaf); yawRaf = 0; } }
    };
    var yawStart = function () {
      var strip = new Image();
      strip.onload = function () {
        yawEl = document.createElement('div');
        yawEl.className = 'who__yaw';
        yawEl.setAttribute('aria-hidden', 'true');
        yawEl.style.backgroundImage = 'url(' + YAW_STRIP + ')';
        yawEl.style.setProperty('--s', '.8');
        yawEl.dataset.frame = '3';
        yawEl.style.backgroundPosition = '50% 0';
        sqArt.appendChild(yawEl);
        sqArt.classList.add('has-yaw');
        sqArt.style.setProperty('--ry', '0deg');
        new IntersectionObserver(function (en) { yawSet(en[0].isIntersecting); }).observe(resSec);
      };
      strip.src = YAW_STRIP;
    };
    var yawLoader = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      yawLoader.disconnect();
      yawStart();
    }, { rootMargin: '300px 0px' });
    yawLoader.observe(resSec);
  }

  /* ---------- Іскри при привітанні: зірочки біля сніговика (подію шле main.js після прокрутки до сцени) ---------- */
  if (Element.prototype.animate) {
    document.addEventListener('snizhok:spark', function (ev) {
      var ox = ev.detail.x, oy = ev.detail.y;
      var colors = ['#FFF8E1', '#F2811D', '#A9C8FF', '#8FE3C0', '#FFFFFF'];
      for (var k = 0; k < 24; k++) {
        var p = document.createElement('span'), sz = 10 + Math.round(Math.random() * 2);
        p.className = 'spark spark--star'; p.setAttribute('aria-hidden', 'true');
        p.style.left = ox + 'px'; p.style.top = oy + 'px'; p.style.width = p.style.height = sz + 'px'; p.style.background = colors[k % colors.length];
        document.body.appendChild(p);
        var a = Math.PI * 2 * k / 24 + Math.random() * 0.3, d = 50 + Math.random() * 70;
        var anim = p.animate([
          { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
          { offset: 0.6, opacity: 1 },
          { transform: 'translate(calc(-50% + ' + (Math.cos(a) * d).toFixed(0) + 'px), calc(-50% + ' + (Math.sin(a) * d * 0.8 - 20).toFixed(0) + 'px)) scale(.25) rotate(140deg)', opacity: 0 },
        ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.25,.6,.4,1)', fill: 'forwards' });
        anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
      }
    });
  }

  /* ---------- Мʼяка поява секцій під час прокрутки (L-13) ---------- */
  if ('IntersectionObserver' in window) {
    var blocks = $$('main > section:not(.hero) > .wrap');
    document.documentElement.classList.add('fx-reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    blocks.forEach(function (b) {
      // те, що вже на екрані під час завантаження, показуємо одразу
      if (b.getBoundingClientRect().top < innerHeight) b.classList.add('is-in'); else io.observe(b);
    });
  }
})();
