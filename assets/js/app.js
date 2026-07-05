/* =============================================================
   app.js — nav, statement reveals, aurora parallax, scrollspy
   ============================================================= */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 30); };
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

  /* ---------- reveals: fades + statement line masks ---------- */
  const revealEls = document.querySelectorAll('.reveal, .stmt__title');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        setTimeout(() => en.target.classList.add('is-visible'), +(en.target.dataset.delay || 0));
        io.unobserve(en.target);
      });
    }, { threshold: .2 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- aurora pointer drift ---------- */
  const aurora = document.querySelector('.aurora');
  if (aurora && !reduced && matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', (e) => {
      const x = (e.clientX / window.innerWidth - .5) * -26;
      const y = (e.clientY / window.innerHeight - .5) * -20;
      aurora.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }

  /* ---------- scrollspy (index anchors) ---------- */
  const spyLinks = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  const spySections = spyLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (spySections.length) {
    const spy = () => {
      let current = null;
      spySections.forEach((s) => { if (window.scrollY >= s.offsetTop - window.innerHeight * .4) current = s.id; });
      spyLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
  }

  /* ---------- year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
