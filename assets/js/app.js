/* =============================================================
   app.js — nav, reveals, counters, decorative charts
   ============================================================= */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobile-nav');
  if (burger && mobile) {
    const toggle = (open) => {
      burger.classList.toggle('open', open);
      mobile.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle(!mobile.classList.contains('open')));
    mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));
  }

  /* ---------- reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        setTimeout(() => en.target.classList.add('is-visible'), +(en.target.dataset.delay || 0));
        io.unobserve(en.target);
      });
    }, { threshold: .15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- count-up ---------- */
  const nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && nums.length && !reduced) {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
        const dur = 1400, start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(target * eased) + suf;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: .6 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------- deterministic PRNG (stable visuals every load) ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* compounding-style series: upward drift + drawdowns; purely illustrative */
  function series(seed, n, vol, drift) {
    const rnd = mulberry32(seed);
    const out = [];
    let v = 1;
    for (let i = 0; i < n; i++) {
      v *= 1 + drift + (rnd() - 0.5) * vol;
      out.push(v);
    }
    return out;
  }

  function setupCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* ---------- hero chart (single series, illustrative — no axes/values) ---------- */
  const heroChart = document.getElementById('hero-chart');
  if (heroChart) {
    const data = series(20260614, 120, 0.10, 0.012);
    let progress = reduced ? 1 : 0;

    function draw() {
      const { ctx, w, h } = setupCanvas(heroChart);
      const pad = { l: 8, r: 14, t: 14, b: 8 };
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const min = Math.min(...data), max = Math.max(...data);
      const X = (i) => pad.l + (i / (data.length - 1)) * iw;
      const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * ih;

      ctx.clearRect(0, 0, w, h);

      // recessive grid — 3 hairlines
      ctx.strokeStyle = 'rgba(13,16,14,.06)';
      ctx.lineWidth = 1;
      for (let g = 1; g <= 3; g++) {
        const y = pad.t + (g / 4) * ih;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + iw, y); ctx.stroke();
      }

      const upto = Math.max(2, Math.floor(data.length * progress));

      // area fill
      const grad = ctx.createLinearGradient(0, pad.t, 0, h);
      grad.addColorStop(0, 'rgba(37,99,235,.16)');
      grad.addColorStop(1, 'rgba(37,99,235,0)');
      ctx.beginPath();
      ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < upto; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.lineTo(X(upto - 1), h - pad.b);
      ctx.lineTo(X(0), h - pad.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 2px line
      ctx.beginPath();
      ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < upto; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();

      // end marker with 2px surface ring
      const ex = X(upto - 1), ey = Y(data[upto - 1]);
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb'; ctx.fill();
    }

    function animate() {
      if (progress < 1) {
        progress = Math.min(1, progress + 0.012);
        draw();
        requestAnimationFrame(animate);
      } else draw();
    }

    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver((es) => {
        es.forEach((en) => { if (en.isIntersecting) { animate(); io.unobserve(en.target); } });
      }, { threshold: .35 });
      io.observe(heroChart);
      draw(); // grid visible before animation starts
    } else {
      draw();
    }
    window.addEventListener('resize', draw);
  }

  /* ---------- sparklines on holding cards ---------- */
  document.querySelectorAll('[data-spark]').forEach((c) => {
    const conf = {
      btc:  { seed: 1971, vol: .14, drift: .011, color: '#b45309' },
      dnet: { seed: 4242, vol: .22, drift: .013, color: '#6d28d9' }
    }[c.dataset.spark] || { seed: 7, vol: .1, drift: .01, color: '#2563eb' };
    const data = series(conf.seed, 48, conf.vol, conf.drift);

    function draw() {
      const { ctx, w, h } = setupCanvas(c);
      const min = Math.min(...data), max = Math.max(...data);
      const X = (i) => 2 + (i / (data.length - 1)) * (w - 10);
      const Y = (v) => 3 + (1 - (v - min) / (max - min)) * (h - 8);
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.strokeStyle = conf.color;
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = .85;
      ctx.stroke();
      ctx.globalAlpha = 1;
      const ex = X(data.length - 1), ey = Y(data[data.length - 1]);
      ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fillStyle = conf.color; ctx.fill();
    }
    draw();
    window.addEventListener('resize', draw);
  });

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
