/* =============================================================
   space.js — procedural deep-space hero + real-footage loader
   No external dependencies. Always renders something.
   ============================================================= */
(function () {
  'use strict';

  const canvas = document.getElementById('space');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR, stars = [], shooting = [], saturn = {}, t = 0, pointer = { x: 0, y: 0 };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    placeSaturn();
  }

  function buildStars() {
    const count = Math.round((W * H) / 5200);
    stars = [];
    const palette = ['#ffffff', '#bfe6ff', '#cdbcff', '#fff3d6'];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),                       // depth → parallax + size
        r: Math.random() * 1.3 + 0.2,
        c: palette[(Math.random() * palette.length) | 0],
        ph: Math.random() * Math.PI * 2,
        tw: 0.4 + Math.random() * 1.6           // twinkle speed
      });
    }
  }

  function placeSaturn() {
    const big = Math.min(W, H);
    saturn = {
      x: W * (W < 760 ? 0.5 : 0.74),
      y: H * (W < 760 ? 0.34 : 0.44),
      r: big * (W < 760 ? 0.16 : 0.17),
      tilt: -0.46            // ring tilt (radians)
    };
  }

  /* ---------- stars ---------- */
  function drawStars() {
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.tw + s.ph);
      const px = (pointer.x * (s.z * 14));
      const py = (pointer.y * (s.z * 14));
      ctx.globalAlpha = (0.25 + s.z * 0.75) * tw;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x + px, s.y + py, s.r * (0.6 + s.z), 0, Math.PI * 2);
      ctx.fill();
      // glow on the brightest
      if (s.z > 0.86) {
        ctx.globalAlpha = 0.12 * tw;
        ctx.beginPath();
        ctx.arc(s.x + px, s.y + py, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- shooting stars ---------- */
  function maybeShoot() {
    if (reduced) return;
    if (Math.random() < 0.006 && shooting.length < 2) {
      const fromLeft = Math.random() > 0.5;
      shooting.push({
        x: fromLeft ? -50 : W + 50,
        y: Math.random() * H * 0.5,
        vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 5),
        vy: 2 + Math.random() * 2,
        life: 1
      });
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const sh = shooting[i];
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
      if (sh.life <= 0) { shooting.splice(i, 1); continue; }
      const tx = sh.x - sh.vx * 6, ty = sh.y - sh.vy * 6;
      const g = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
      g.addColorStop(0, `rgba(180,235,255,${sh.life})`);
      g.addColorStop(1, 'rgba(180,235,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  }

  /* ---------- Saturn ---------- */
  function drawRingBands(s, alphaMul) {
    const bands = [
      { i: 1.32, o: 1.42, a: 0.10 },
      { i: 1.45, o: 1.95, a: 0.45 },  // B ring (bright)
      { i: 1.96, o: 2.02, a: 0.05 },  // Cassini division (gap)
      { i: 2.04, o: 2.34, a: 0.28 },  // A ring
      { i: 2.40, o: 2.52, a: 0.10 }
    ];
    for (const b of bands) {
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r * b.o, s.r * b.o * Math.abs(Math.sin(s.tilt)) + s.r * b.o * 0.06, 0, 0, Math.PI * 2);
      ctx.ellipse(s.x, s.y, s.r * b.i, s.r * b.i * Math.abs(Math.sin(s.tilt)) + s.r * b.i * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(228,214,182,${b.a * alphaMul})`;
      ctx.fill('evenodd');
    }
  }

  function drawSaturn() {
    const s = saturn;
    const ry = s.r; // planet radius
    const ringFlat = (rx) => rx * Math.abs(Math.sin(s.tilt)) + rx * 0.06;

    // --- BACK half of rings (clip to above planet centre) ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 3); // top region
    ctx.clip();
    drawRingBands(s, 0.85);
    ctx.restore();

    // --- planet glow / atmosphere ---
    ctx.save();
    ctx.shadowColor = 'rgba(120,180,255,0.5)';
    ctx.shadowBlur = s.r * 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, ry, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,30,55,1)';
    ctx.fill();
    ctx.restore();

    // --- planet body (lit gradient) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, ry, 0, Math.PI * 2);
    ctx.clip();
    const lg = ctx.createRadialGradient(
      s.x - ry * 0.42, s.y - ry * 0.42, ry * 0.15,
      s.x, s.y, ry * 1.25
    );
    lg.addColorStop(0, '#f4e4bd');
    lg.addColorStop(0.4, '#d9c193');
    lg.addColorStop(0.7, '#a8895a');
    lg.addColorStop(1, '#2a2034');
    ctx.fillStyle = lg;
    ctx.fillRect(s.x - ry, s.y - ry, ry * 2, ry * 2);

    // atmospheric bands
    for (let i = -6; i <= 6; i++) {
      const yy = s.y + (i / 6) * ry * 0.92;
      ctx.globalAlpha = 0.08 + 0.04 * Math.sin(i * 1.3 + t * 0.2);
      ctx.fillStyle = i % 2 ? '#5a472e' : '#f6e9c8';
      ctx.fillRect(s.x - ry, yy - ry * 0.05, ry * 2, ry * 0.1);
    }
    ctx.globalAlpha = 1;

    // ring shadow cast on planet
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#1c1626';
    ctx.lineWidth = ry * 0.10;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, ry * 1.0, ringFlat(ry) * 0.9, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // terminator shading (dark limb opposite the light)
    const sh = ctx.createRadialGradient(
      s.x + ry * 0.55, s.y + ry * 0.5, ry * 0.2,
      s.x + ry * 0.2, s.y + ry * 0.2, ry * 1.4
    );
    sh.addColorStop(0, 'rgba(5,6,16,0.8)');
    sh.addColorStop(0.55, 'rgba(5,6,16,0.15)');
    sh.addColorStop(1, 'rgba(5,6,16,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(s.x - ry, s.y - ry, ry * 2, ry * 2);
    ctx.restore();

    // rim light
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'rgba(150,200,255,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, ry, Math.PI * 1.05, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();

    // --- FRONT half of rings (clip below planet centre) ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x - s.r * 3, s.y, s.r * 6, s.r * 3); // bottom region
    ctx.clip();
    drawRingBands(s, 1);
    ctx.restore();
  }

  /* ---------- loop ---------- */
  function frame() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    drawStars();
    maybeShoot();
    drawSaturn();
    if (!reduced) requestAnimationFrame(frame);
  }

  /* ---------- pointer parallax ---------- */
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5);
    pointer.y = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();
  frame();

  /* =============================================================
     Real-footage layer.
     Tries local file first, then a real NASA Cassini clip hosted
     on Wikimedia Commons (public domain). If none load, the
     procedural canvas above remains as the hero — so it always works.
     Drop your own clip at assets/video/space.mp4 to override.
     ============================================================= */
  const hero = document.querySelector('.hero');
  const video = document.getElementById('hero-video');
  if (!hero || !video) return;

  const SOURCES = [
    'assets/video/space.mp4',
    'assets/video/space.webm',
    // Real NASA / Cassini footage, public domain, served by Wikimedia Commons:
    'https://commons.wikimedia.org/wiki/Special:FilePath/PIA21047%20-%20Saturn%20Rotation%20Cassini.ogv',
    "https://commons.wikimedia.org/wiki/Special:FilePath/PIA21441%20-%20Cassini's%20'Porthole'%20Movie%20of%20Saturn,%20Figure%201.ogv"
  ];

  let idx = 0, settled = false, timer = null;

  function succeed() {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    video.play().catch(() => {});
    video.classList.add('is-playing');
    hero.classList.add('video-on');
  }
  function tryNext() {
    clearTimeout(timer);
    if (settled || idx >= SOURCES.length) return;   // give up → canvas stays
    const src = SOURCES[idx++];
    video.src = src;
    video.load();
    timer = setTimeout(tryNext, 9000);              // unsupported/slow → move on
  }

  video.addEventListener('loadeddata', succeed);
  video.addEventListener('canplay', succeed);
  video.addEventListener('error', tryNext);
  video.addEventListener('stalled', () => { if (!settled) tryNext(); });

  if (!reduced) tryNext();   // honour reduced-motion: keep static canvas
})();
