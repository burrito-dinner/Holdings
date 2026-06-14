/* =============================================================
   paywall.js — client-side premium gate

   NOTE ON SECURITY: this is a FRONT-END gate only. Because the site
   is fully static (no server), the gated text still exists in the page
   source and a determined visitor could read it via dev-tools. It is
   meant as a soft "members" wall for casual visitors, not hard DRM.
   For a real paywall you'd verify access on a server / payment webhook.

   To change the access code, edit ACCESS_CODE below.
   To wire real payments, point the "Request access" button at your
   Stripe Payment Link / checkout URL in the HTML.
   ============================================================= */
(function () {
  'use strict';

  const ACCESS_CODE = 'SATURN';            // <-- change me
  const STORAGE_KEY = 'bfd_unlocked';

  const body = document.body;
  const modal = document.getElementById('paywall-modal');

  function unlock(persist) {
    body.classList.add('unlocked');
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    }
    closeModal();
  }
  function lock() {
    body.classList.remove('unlocked');
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // restore previous unlock
  try { if (localStorage.getItem(STORAGE_KEY) === '1') body.classList.add('unlocked'); } catch (e) {}

  function openModal() { if (modal) modal.classList.add('is-open'); const i = document.getElementById('pw-input'); if (i) { i.value=''; setTimeout(()=>i.focus(),50);} const e=document.getElementById('pw-error'); if(e) e.textContent=''; }
  function closeModal() { if (modal) modal.classList.remove('is-open'); }

  // any element with [data-unlock] opens the modal
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-unlock]');
    if (opener) { e.preventDefault(); openModal(); }
    const closer = e.target.closest('[data-close]');
    if (closer) { e.preventDefault(); closeModal(); }
    const locker = e.target.closest('[data-lock]');
    if (locker) { e.preventDefault(); lock(); }
  });

  if (modal) {
    modal.querySelector('.modal__backdrop')?.addEventListener('click', closeModal);
    const form = document.getElementById('pw-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (document.getElementById('pw-input').value || '').trim().toUpperCase();
      const err = document.getElementById('pw-error');
      if (val === ACCESS_CODE) {
        unlock(true);
      } else {
        if (err) err.textContent = 'Invalid access code.';
        modal.classList.add('shake');
        setTimeout(() => modal.classList.remove('shake'), 450);
      }
    });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
