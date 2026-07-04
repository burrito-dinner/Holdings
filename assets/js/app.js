/* =============================================================
   app.js — preloader, cursor, nav, reveals, marquee-safe utils
   ============================================================= */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- preloader (home only, element optional) ---------- */
  const loader = document.getElementById('loader');
  function finishLoad() {
    document.body.classList.add('loaded');
    if (loader) {
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 1000);
    }
  }
  if (loader && !reduced) {
    const pct = loader.querySelector('.loader__pct');
    const bar = loader.querySelector('.loader__bar i');
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 26);
      if (pct) pct.textContent = String(Math.floor(p)).padStart(3, '0');
      if (bar) bar.style.width = p + '%';
      if (p >= 100) { clearInterval(iv); setTimeout(finishLoad, 250); }
    }, 110);
  } else {
    finishLoad();
  }

  /* ---------- custom cursor ---------- */
  const dot = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if (dot && ring && matchMedia('(hover: hover)').matches && !reduced) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', (e) => {
      ring.classList.toggle('is-hover', !!e.target.closest('a, button, [data-unlock]'));
    });
  }

  /* ---------- scroll progress + nav ---------- */
  const progress = document.querySelector('.progress');
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    if (progress) {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      progress.style.width = (p * 100) + '%';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
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
  const revealEls = document.querySelectorAll('.reveal, .mandate__quote');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        const d = en.target.dataset.delay || 0;
        setTimeout(() => en.target.classList.add('is-visible'), +d);
        io.unobserve(en.target);
      });
    }, { threshold: .14 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- mandate word stagger ---------- */
  document.querySelectorAll('.mandate__quote').forEach((q) => {
    if (q.dataset.split) return;
    q.dataset.split = '1';
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (/^\s+$/.test(w) || w === '') { frag.appendChild(document.createTextNode(w)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = w;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(q);
    const words = q.querySelectorAll('.w');
    words.forEach((w, i) => { w.style.transitionDelay = (i * 45) + 'ms'; });
  });

  /* ---------- holding-card spotlight ---------- */
  document.querySelectorAll('.holding').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--ax', (e.clientX - r.left) + 'px');
      card.style.setProperty('--ay', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
