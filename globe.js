/* Сніжна куля (L-20): WebGL1 без бібліотек.
   Скляна сфера з френелевим відблиском, усередині 380 сніжинок (один draw call) і статична текстура столу.
   Кадри малюються лише під час струсу та ще ≈6 с, поки сніг осідає; далі requestAnimationFrame не викликається.
   Підключення: SnizhokGlobe.init(елемент, { onView(площа), onFail() }) → { shake, setHold, destroy } або null. */
(function () {
  'use strict';

  var N = 380;            // сніжинок
  var R = 0.9;            // радіус скла в одиницях сфери
  var FLOOR = -0.8;      // рівень снігу на «столі»
  var SETTLE = 6;         // секунд кадрів після останнього струсу
  var MAX_PX = 480, MAX_DPR = 1.5;

  var VS_QUAD = 'attribute vec2 a;varying vec2 p;void main(){p=a;gl_Position=vec4(a,0.,1.);}';
  var FS_QUAD = [
    'precision mediump float;varying vec2 p;',
    'uniform sampler2D t;uniform vec2 off;uniform float pass,aa;',
    'void main(){',
    ' vec2 q=p/0.94;float d=length(q);',
    ' float m=1.-smoothstep(1.-aa,1.,d);',
    ' if(m<=0.)discard;',
    ' float nz=sqrt(max(1.-d*d,0.));',
    ' if(pass<.5){',
    '  vec2 uv=0.5+(q*(0.80+0.12*d*d)+off*0.6)*0.5;',
    '  vec3 c=texture2D(t,vec2(uv.x,1.-uv.y)).rgb;',
    '  c*=0.55+0.45*nz;',
    '  c+=vec3(0.04,0.08,0.18)*(1.-nz);',
    '  gl_FragColor=vec4(c,1.)*m;',
    ' }else{',
    '  float f=pow(1.-nz,4.);',
    '  vec2 h=(q-off*0.5)-vec2(-0.5,0.5);float s=exp(-dot(h*vec2(5.5,11.),h*vec2(5.5,11.))*7.);',
    '  float rim=smoothstep(0.95,1.,d)*0.38;',
    '  vec3 col=vec3(0.66,0.80,1.)*(f*0.6+rim)+vec3(1.,0.97,0.88)*(s*0.7);',
    '  float a=clamp(f*0.42+rim*0.7+s*0.8,0.,0.85);',
    '  gl_FragColor=vec4(min(col,1.)*a,a)*m;',
    ' }',
    '}'].join('\n');
  var VS_SNOW = 'attribute vec3 a;uniform vec2 off;uniform float k;varying float v;void main(){v=a.z;gl_Position=vec4(a.xy*0.94+off*0.03,0.,1.);gl_PointSize=a.z*k;}';
  var FS_SNOW = 'precision mediump float;varying float v;void main(){float d=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.45,1.,d);gl_FragColor=vec4(1.,.98,.92,1.)*a*.92;}';

  function shader(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader');
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link');
    return p;
  }

  function init(el, opts) {
    opts = opts || {};
    var cv = el.querySelector('canvas');
    var gl = null;
    if (!cv) return null;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false }); } catch (e) { gl = null; }
    if (!gl) return null;

    var pq, ps, quadBuf, snowBuf, tex;
    try {
      pq = program(gl, VS_QUAD, FS_QUAD); ps = program(gl, VS_SNOW, FS_SNOW);
    } catch (e) { return null; }

    quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var snowData = new Float32Array(N * 3);
    snowBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, snowBuf);
    gl.bufferData(gl.ARRAY_BUFFER, snowData, gl.DYNAMIC_DRAW);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 21, 48, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var uq = { t: gl.getUniformLocation(pq, 't'), off: gl.getUniformLocation(pq, 'off'), pass: gl.getUniformLocation(pq, 'pass'), aa: gl.getUniformLocation(pq, 'aa') };
    var us = { off: gl.getUniformLocation(ps, 'off'), k: gl.getUniformLocation(ps, 'k') };
    var aq = gl.getAttribLocation(pq, 'a'), as = gl.getAttribLocation(ps, 'a');

    /* ---------- Сніг: проста фізика в одиницях сфери ---------- */
    var X = new Float32Array(N), Y = new Float32Array(N), VX = new Float32Array(N), VY = new Float32Array(N);
    var PH = new Float32Array(N), SZ = new Float32Array(N), REST = new Uint8Array(N), LAND = new Float32Array(N);
    var i, restCount = N;
    for (i = 0; i < N; i++) {
      PH[i] = Math.random() * 6.28; SZ[i] = 1.6 + Math.random() * 2.2;
      LAND[i] = FLOOR + Math.random() * 0.1;
      X[i] = (Math.random() * 2 - 1) * 0.46; Y[i] = LAND[i]; REST[i] = 1;
    }
    var time = 0, settleLeft = 0, hold = false, inView = false, area = 0;
    var tiltX = 0, tiltY = 0, tx = 0, ty = 0, jitter = 0, dragging = false;
    var raf = 0, last = 0, size = 0, dead = false;

    function kick(power, dx, dy, share) {
      for (var j = 0; j < N; j++) {
        if (Math.random() > share) continue;
        if (REST[j]) { REST[j] = 0; restCount--; }
        VX[j] += (Math.random() - 0.5) * 2.6 * power + dx;
        VY[j] += (0.9 + Math.random() * 1.9) * power + dy;
      }
      settleLeft = SETTLE; jitter = Math.min(1, jitter + 0.7 * power);
    }

    function step(dt) {
      time += dt;
      var drag = Math.exp(-2.2 * dt);
      for (var j = 0; j < N; j++) {
        if (REST[j]) continue;
        VY[j] -= 0.75 * dt;
        VX[j] += Math.sin(time * 2.1 + PH[j]) * 0.28 * dt;
        VX[j] *= drag; VY[j] *= drag;
        X[j] += VX[j] * dt; Y[j] += VY[j] * dt;
        var r = Math.sqrt(X[j] * X[j] + Y[j] * Y[j]);
        if (r > R) {
          var nx = X[j] / r, ny = Y[j] / r, vn = VX[j] * nx + VY[j] * ny;
          X[j] = nx * R; Y[j] = ny * R;
          if (vn > 0) { VX[j] -= 1.6 * vn * nx; VY[j] -= 1.6 * vn * ny; }
        }
        if (Y[j] <= LAND[j]) { Y[j] = LAND[j]; VX[j] = VY[j] = 0; REST[j] = 1; restCount++; }
      }
      var spring = dragging ? 10 : 6;
      tiltX += (tx - tiltX) * Math.min(1, spring * dt);
      tiltY += (ty - tiltY) * Math.min(1, spring * dt);
      jitter *= Math.exp(-3 * dt);
    }

    /* ---------- Малювання ---------- */
    function fit() {
      var css = el.clientWidth || 300;
      var px = Math.max(64, Math.min(MAX_PX, Math.round(css * Math.min(window.devicePixelRatio || 1, MAX_DPR))));
      if (px !== size) { size = px; cv.width = px; cv.height = px; }
      gl.viewport(0, 0, size, size);
    }
    function draw() {
      if (dead || gl.isContextLost()) return;
      var ox = tiltX * 0.5 + Math.sin(time * 38) * 0.05 * jitter, oy = tiltY * 0.5 + Math.cos(time * 31) * 0.04 * jitter;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(pq);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(aq); gl.vertexAttribPointer(aq, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(uq.t, 0);
      gl.uniform2f(uq.off, ox, oy); gl.uniform1f(uq.aa, 3 / size * 2);
      gl.uniform1f(uq.pass, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      for (var j = 0; j < N; j++) { snowData[j * 3] = X[j]; snowData[j * 3 + 1] = Y[j]; snowData[j * 3 + 2] = SZ[j]; }
      gl.useProgram(ps);
      gl.bindBuffer(gl.ARRAY_BUFFER, snowBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, snowData);
      gl.enableVertexAttribArray(as); gl.vertexAttribPointer(as, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(us.off, ox, oy); gl.uniform1f(us.k, size / 300);
      gl.drawArrays(gl.POINTS, 0, N);

      gl.useProgram(pq);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.vertexAttribPointer(aq, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uq.pass, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function active() { return !dead && inView && !hold && !document.hidden; }
    function needsFrames() { return dragging || settleLeft > 0 || restCount < N || Math.abs(tiltX) + Math.abs(tiltY) > 0.002; }
    function frame(now) {
      raf = 0;
      if (!active()) { last = 0; return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      step(dt);
      if (!dragging) settleLeft -= dt;
      draw();
      if (needsFrames()) raf = requestAnimationFrame(frame);
      else { last = 0; settleLeft = 0; }
    }
    function wake() { if (!raf && active() && needsFrames()) { last = 0; raf = requestAnimationFrame(frame); } }
    function sleep() { if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } }

    function shake(power) { kick(power || 1, 0, 0, 1); tx = 0; ty = 0; wake(); }

    /* ---------- Ввід ---------- */
    var pid = null, px0 = 0, py0 = 0, pxl = 0, pyl = 0, moved = 0, acc = 0, engaged = false, isTouch = false;
    function engage(e) {
      engaged = true; dragging = true; pxl = e.clientX; pyl = e.clientY;
      try { el.setPointerCapture(pid); } catch (er) { /* без захоплення теж працює */ }
      settleLeft = SETTLE; wake();
    }
    function onDown(e) {
      if (pid !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pid = e.pointerId; px0 = pxl = e.clientX; py0 = pyl = e.clientY; moved = 0; acc = 0; engaged = false;
      isTouch = e.pointerType === 'touch';
      if (!isTouch) engage(e);
    }
    function onMove(e) {
      if (e.pointerId !== pid) return;
      if (!engaged) {
        var ax = Math.abs(e.clientX - px0), ay = Math.abs(e.clientY - py0);
        if (ax > 8 && ax > ay) engage(e);
        else { if (ay > 8) pid = null; return; }
      }
      var w = el.clientWidth || 300, dx = (e.clientX - pxl) / w * 2, dy = -(e.clientY - pyl) / w * 2;
      pxl = e.clientX; pyl = e.clientY;
      var len = Math.sqrt(dx * dx + dy * dy); moved += len; acc += len;
      tx = Math.max(-1, Math.min(1, (e.clientX - px0) / w * 3)); ty = Math.max(-1, Math.min(1, -(e.clientY - py0) / w * 3));
      if (acc > 0.1) { kick(Math.min(1, 0.35 + acc * 1.5), dx * 6, dy * 6, 0.4); acc = 0; }
      wake();
    }
    function onUp(e) {
      if (e.pointerId !== pid) return;
      pid = null; dragging = false; tx = 0; ty = 0;
      if ((!engaged || moved < 0.1) && e.type === 'pointerup') kick(0.9, 0, 0, 1);
      engaged = false; settleLeft = SETTLE; wake();
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); if (!e.repeat) shake(1); }
    }
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('keydown', onKey);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- Життєвий цикл ---------- */
    var io = null, ro = null;
    function onVis() { if (document.hidden) sleep(); else wake(); }
    function fail() { if (dead) return; destroy(); if (opts.onFail) opts.onFail(); }
    function destroy() {
      dead = true; sleep();
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('keydown', onKey);
    }
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); fail(); });
    document.addEventListener('visibilitychange', onVis);

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) {
        var en = es[es.length - 1];
        inView = en.isIntersecting;
        area = inView ? en.intersectionRect.width * en.intersectionRect.height : 0;
        if (opts.onView) opts.onView(area);
        if (inView) wake(); else sleep();
      }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
      io.observe(el);
    } else { inView = true; }
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { if (!dead) { fit(); draw(); } });
      ro.observe(el);
    }

    fit(); draw();
    // вікно «До Нового року» в текстурі: справжнє число днів, як у демо (текстура 512 px, вікно 272,178 156×84)
    var withDays = function (src) {
      if (el.getAttribute('data-days') === 'off') return src;
      var c = document.createElement('canvas'), k = src.width / 512;
      c.width = src.width; c.height = src.height;
      var x = c.getContext('2d');
      x.drawImage(src, 0, 0);
      var now = new Date(), d = Math.ceil((new Date(now.getFullYear() + 1, 0, 1) - now) / 86400000);
      var m10 = d % 10, m100 = d % 100;
      var word = (m10 === 1 && m100 !== 11) ? 'день' : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? 'дні' : 'днів';
      x.scale(k, k); x.textBaseline = 'alphabetic';
      x.fillStyle = '#E06F0B'; x.font = '900 38px "Segoe UI", system-ui, sans-serif'; x.fillText(String(d), 290, 244);
      var w = x.measureText(String(d)).width;
      x.fillStyle = '#56627A'; x.font = '600 12px "Segoe UI", system-ui, sans-serif'; x.fillText(word, 290 + w + 8, 244);
      return c;
    };
    var img = new Image();
    img.onload = function () {
      if (dead || gl.isContextLost()) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, withDays(img));
      draw();
      el.classList.add('is-live');
    };
    img.onerror = function () { fail(); };
    img.src = el.getAttribute('data-tex') || 'img/globe-desk.webp';

    return {
      shake: shake,
      setHold: function (h) { hold = !!h; if (hold) sleep(); else wake(); },
      destroy: destroy,
      get area() { return area; },
    };
  }

  window.SnizhokGlobe = { init: init };
})();
