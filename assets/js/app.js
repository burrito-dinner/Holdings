/* =============================================================
   app.js — nav, reveals, counters, sparklines, word-stagger
   ============================================================= */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero line-mask reveal */
  requestAnimationFrame(() => document.body.classList.add('loaded'));

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

  /* ---------- reveals (also drives .rule-draw via .is-visible) ---------- */
  const revealEls = document.querySelectorAll('.reveal, .rule-draw, .band__title');
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

  /* ---------- band title word stagger ---------- */
  document.querySelectorAll('.band__title').forEach((q) => {
    if (q.dataset.split) return;
    q.dataset.split = '1';
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (/^\s*$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = w;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(q);
    q.querySelectorAll('.w').forEach((w, i) => { w.style.transitionDelay = (i * 50) + 'ms'; });
  });

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

  /* ---------- deterministic PRNG ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function series(seed, n, vol, drift) {
    const rnd = mulberry32(seed);
    const out = []; let v = 1;
    for (let i = 0; i < n; i++) { v *= 1 + drift + (rnd() - 0.5) * vol; out.push(v); }
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

  /* ---------- sparklines (decorative, illustrative) ---------- */
  document.querySelectorAll('[data-spark]').forEach((c) => {
    const conf = {
      btc:  { seed: 1971, vol: .14, drift: .011, color: '#b45309' },
      dnet: { seed: 4242, vol: .22, drift: .013, color: '#6d28d9' }
    }[c.dataset.spark] || { seed: 7, vol: .1, drift: .01, color: '#1c3560' };
    const data = series(conf.seed, 48, conf.vol, conf.drift);

    function draw(progress) {
      const { ctx, w, h } = setupCanvas(c);
      const min = Math.min(...data), max = Math.max(...data);
      const upto = Math.max(2, Math.floor(data.length * progress));
      const X = (i) => 2 + (i / (data.length - 1)) * (w - 10);
      const Y = (v) => 3 + (1 - (v - min) / (max - min)) * (h - 8);
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < upto; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.strokeStyle = conf.color;
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = .8;
      ctx.stroke();
      ctx.globalAlpha = 1;
      const ex = X(upto - 1), ey = Y(data[upto - 1]);
      ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fillStyle = '#f9f6ee'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fillStyle = conf.color; ctx.fill();
    }

    /* draw-on when scrolled into view */
    let p = reduced ? 1 : 0;
    function animate() {
      if (p < 1) { p = Math.min(1, p + .03); draw(p); requestAnimationFrame(animate); }
      else draw(1);
    }
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver((es) => {
        es.forEach((en) => { if (en.isIntersecting) { animate(); io.unobserve(en.target); } });
      }, { threshold: .4 });
      io.observe(c);
    } else {
      draw(1);
    }
    window.addEventListener('resize', () => draw(p));
  });

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
