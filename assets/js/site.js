(() => {
  'use strict';

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const desktop = window.matchMedia('(min-width: 1080px)');

  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    desktop.addEventListener('change', () => setMenu(false));
  }

  /* ---------- Sub-menus (disclosure pattern) ---------- */
  const toggles = Array.from(document.querySelectorAll('.nav__toggle'));

  function setSub(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.hidden = !open;
  }
  function closeAllSubs(except) {
    toggles.forEach((t) => { if (t !== except) setSub(t, false); });
  }

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      if (desktop.matches) closeAllSubs(btn);
      setSub(btn, open);
    });
  });

  // Open the section containing the current page in the mobile menu.
  document.querySelectorAll('.nav__group.is-active .nav__toggle').forEach((btn) => {
    if (!desktop.matches) setSub(btn, true);
  });

  document.addEventListener('click', (e) => {
    if (desktop.matches && !e.target.closest('.nav__group')) closeAllSubs();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openSub = toggles.find((t) => t.getAttribute('aria-expanded') === 'true');
    if (openSub && desktop.matches) {
      setSub(openSub, false);
      openSub.focus();
    } else if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  // Close desktop dropdowns when focus leaves them.
  document.querySelectorAll('.nav__group').forEach((group) => {
    group.addEventListener('focusout', (e) => {
      if (desktop.matches && !group.contains(e.relatedTarget)) {
        const btn = group.querySelector('.nav__toggle');
        if (btn) setSub(btn, false);
      }
    });
  });

  /* ---------- Highlight today in hours tables ---------- */
  const today = new Date().getDay(); // 0 = Sunday
  document.querySelectorAll('.hours tr[data-day]').forEach((row) => {
    if (Number(row.dataset.day) !== today) return;
    row.classList.add('is-today');
    const th = row.querySelector('th');
    if (th && !th.querySelector('.today-badge')) {
      const badge = document.createElement('span');
      badge.className = 'today-badge';
      badge.textContent = 'Today';
      th.appendChild(badge);
    }
  });

  /* ---------- Gallery prev/next ---------- */
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('.gallery__track');
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 16 : 300);
    gallery.querySelector('[data-prev]')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    gallery.querySelector('[data-next]')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  });

  /* ---------- Reduced motion: pause decorative autoplay video ---------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }

  /* ---------- Forms ---------- */
  const PHONE = '(970) 330-2695';

  function fieldError(input) {
    const v = input.validity;
    if (v.valid) return '';
    const label = input.closest('.field')?.querySelector('label')?.textContent.replace('*', '').trim() || 'This field';
    if (v.valueMissing) return `${label} is required.`;
    if (v.typeMismatch && input.type === 'email') return 'Enter a valid email address, like name@example.com.';
    if (v.patternMismatch && input.type === 'tel') return 'Enter a valid phone number, like 970-555-0123.';
    if (v.rangeUnderflow) return `${label} must be at least ${input.min}.`;
    if (v.rangeOverflow) return `${label} must be ${input.max} or less.`;
    return input.validationMessage;
  }

  function showError(input, msg) {
    const errEl = document.getElementById(`${input.id}-error`);
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (errEl) errEl.textContent = msg;
  }

  document.querySelectorAll('form[data-form]').forEach((form) => {
    form.noValidate = true;
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    const inputs = Array.from(form.querySelectorAll('input, select, textarea')).filter((el) => el.id);

    inputs.forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) showError(input, fieldError(input)); });
      input.addEventListener('input', () => { if (input.getAttribute('aria-invalid')) showError(input, fieldError(input)); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      let firstInvalid = null;
      inputs.forEach((input) => {
        const msg = fieldError(input);
        showError(input, msg);
        if (msg && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        status.classList.add('form-status--error');
        status.textContent = 'Please fix the highlighted fields and try again.';
        firstInvalid.focus();
        return;
      }

      const endpoint = form.getAttribute('action');
      if (!endpoint) {
        status.classList.add('form-status--info');
        status.textContent = `Online submissions are temporarily unavailable. Please call us at ${PHONE}.`;
        status.focus();
        return;
      }

      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.classList.add('form-status--success');
        status.textContent = form.dataset.success || 'Thanks for submitting!';
      } catch {
        status.classList.add('form-status--error');
        status.textContent = `Sorry, something went wrong. Please try again or call us at ${PHONE}.`;
      } finally {
        submit.disabled = false;
        submit.textContent = original;
        status.focus();
      }
    });
  });
})();
