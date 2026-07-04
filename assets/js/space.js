/* =============================================================
   space.js — cinematic Saturn + starfield, warm palette
   Zero dependencies. Always renders. Video layer optional.
   ============================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('space');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR, stars = [], meteors = [], sat = {}, t = 0;
  const pointer = { x: 0, y: 0 };
  let scrollN = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    const m = Math.min(W, H);
    sat = {
      x: W * (W < 760 ? 0.5 : 0.72),
      y: H * (W < 760 ? 0.30 : 0.38),
      r: m * (W < 760 ? 0.17 : 0.19),
      tilt: -0.42
    };
  }

  function buildStars() {
    stars = [];
    const n = Math.round((W * H) / 8000);
    const pal = ['#f2ede3', '#fff3da', '#e6dcc4', '#d9d4c8'];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        z: Math.random(), r: Math.random() * 1.1 + .2,
        c: pal[(Math.random() * pal.length) | 0],
        ph: Math.random() * Math.PI * 2, tw: .3 + Math.random()
      });
    }
  }

  function drawStars() {
    for (const s of stars) {
      const tw = .55 + .45 * Math.sin(t * s.tw + s.ph);
      const px = pointer.x * s.z * 16, py = pointer.y * s.z * 16 + scrollN * s.z * 60;
      ctx.globalAlpha = (.15 + s.z * .6) * tw;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x + px, s.y + py, s.r * (.6 + s.z), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function maybeMeteor() {
    if (reduced) return;
    if (Math.random() < .0018 && meteors.length < 1) {
      const fromLeft = Math.random() > .5;
      meteors.push({
        x: fromLeft ? -40 : W + 40, y: Math.random() * H * .4,
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 4), vy: 1.6 + Math.random() * 1.6, life: 1
      });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= .011;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      const tx = m.x - m.vx * 7, ty = m.y - m.vy * 7;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(242,230,205,${m.life * .9})`);
      g.addColorStop(1, 'rgba(242,230,205,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  }

  /* ring band profile: alpha as a function of normalized radius 1.28→2.5 */
  function bandAlpha(q) {
    if (q < 1.30 || q > 2.46) return 0;
    if (q < 1.46) return .10 + .05 * Math.sin(q * 40);          // C ring — dim
    if (q < 1.95) return .34 + .10 * Math.sin(q * 34);          // B ring — bright
    if (q < 2.02) return .03;                                   // Cassini division
    if (q < 2.32) return .22 + .07 * Math.sin(q * 46);          // A ring
    if (q < 2.36) return .04;                                   // Encke-ish gap
    return .10;
  }

  function drawRings(front) {
    const { x, y, r, tilt } = sat;
    const squash = Math.abs(Math.sin(tilt)) * .92 + .05;
    ctx.save();
    ctx.beginPath();
    if (front) ctx.rect(x - r * 3, y, r * 6, r * 3);
    else       ctx.rect(x - r * 3, y - r * 3, r * 6, r * 3);
    ctx.clip();
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const q = 1.28 + (i / steps) * (2.5 - 1.28);
      const a = bandAlpha(q);
      if (a <= 0) continue;
      const warm = q < 1.95 ? '224,204,166' : '206,190,158';
      ctx.strokeStyle = `rgba(${warm},${a * (front ? 1 : .8)})`;
      ctx.lineWidth = r * (2.5 - 1.28) / steps * 1.25;
      ctx.beginPath();
      ctx.ellipse(x, y, r * q, r * q * squash, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlanet() {
    const { x, y, r } = sat;

    // atmosphere glow
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, r * .8, x, y, r * 1.6);
    glow.addColorStop(0, 'rgba(210,185,140,.14)');
    glow.addColorStop(1, 'rgba(210,185,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    ctx.restore();

    // body
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const lg = ctx.createRadialGradient(x - r * .45, y - r * .45, r * .1, x, y, r * 1.3);
    lg.addColorStop(0, '#efdfb8');
    lg.addColorStop(.42, '#d8c092');
    lg.addColorStop(.72, '#9c7f52');
    lg.addColorStop(1, '#241c14');
    ctx.fillStyle = lg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    // latitudinal bands
    for (let i = -7; i <= 7; i++) {
      const yy = y + (i / 7) * r * .94;
      ctx.globalAlpha = .05 + .035 * Math.sin(i * 1.7 + 1);
      ctx.fillStyle = i % 2 ? '#6d5837' : '#f4e8ca';
      ctx.fillRect(x - r, yy - r * .045, r * 2, r * .09);
    }
    ctx.globalAlpha = 1;

    // ring shadow across the disc
    ctx.globalAlpha = .2;
    ctx.strokeStyle = '#120e08';
    ctx.lineWidth = r * .09;
    ctx.beginPath();
    ctx.ellipse(x, y - r * .06, r * .99, r * .34, 0, Math.PI * .02, Math.PI * .98);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // terminator
    const sh = ctx.createRadialGradient(x + r * .6, y + r * .45, r * .1, x + r * .25, y + r * .2, r * 1.45);
    sh.addColorStop(0, 'rgba(4,4,4,.86)');
    sh.addColorStop(.55, 'rgba(4,4,4,.16)');
    sh.addColorStop(1, 'rgba(4,4,4,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();

    // rim light
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.strokeStyle = 'rgba(240,224,190,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 1.02, Math.PI * 1.72);
    ctx.stroke();
    ctx.restore();
  }

  function frame() {
    t += .016;
    ctx.clearRect(0, 0, W, H);
    // parallax drift of the whole scene with scroll
    ctx.save();
    ctx.translate(pointer.x * 8, pointer.y * 8 + scrollN * 90);
    drawStars();
    maybeMeteor();
    drawRings(false);
    drawPlanet();
    drawRings(true);
    ctx.restore();
    if (!reduced) requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - .5;
    pointer.y = e.clientY / window.innerHeight - .5;
  }, { passive: true });
  window.addEventListener('scroll', () => {
    scrollN = Math.min(window.scrollY / window.innerHeight, 1);
  }, { passive: true });
  window.addEventListener('resize', resize);
  resize();
  frame();

  /* ---------- optional real-footage layer ----------
     Local file wins; then real NASA/Cassini footage from Wikimedia
     Commons; else the canvas above simply remains. */
  const hero = document.querySelector('.hero');
  const video = document.getElementById('hero-video');
  if (!hero || !video) return;

  const SOURCES = [
    'assets/video/space.mp4',
    'assets/video/space.webm',
    'https://commons.wikimedia.org/wiki/Special:FilePath/PIA21047%20-%20Saturn%20Rotation%20Cassini.ogv'
  ];
  let idx = 0, settled = false, timer = null;
  function succeed() {
    if (settled) return;
    settled = true; clearTimeout(timer);
    video.play().catch(() => {});
    video.classList.add('is-playing');
    hero.classList.add('video-on');
  }
  function tryNext() {
    clearTimeout(timer);
    if (settled || idx >= SOURCES.length) return;
    video.src = SOURCES[idx++]; video.load();
    timer = setTimeout(tryNext, 9000);
  }
  video.addEventListener('loadeddata', succeed);
  video.addEventListener('canplay', succeed);
  video.addEventListener('error', tryNext);
  if (!reduced) tryNext();
})();
