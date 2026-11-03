/* js/login.js — sign-in page behaviour. */
(() => {
  const $ = (s) => document.querySelector(s);
  const idEl = $('#id'), pwEl = $('#pw'), err = $('#err');

  $('#yr').textContent = new Date().getFullYear();

  $('#toggle').addEventListener('click', (e) => {
    const show = pwEl.type === 'password';
    pwEl.type = show ? 'text' : 'password';
    e.target.textContent = show ? 'Hide' : 'Show';
    e.target.setAttribute('aria-pressed', String(show));
  });

  // Make Enter submission explicit for both credential fields. requestSubmit()
  // preserves browser validation and dispatches the form's submit event.
  [idEl, pwEl].forEach((input) => input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      $('#login').requestSubmit();
    }
  }));

  const LOCK_KEY = 'pci_login_attempts';
  const getAttempts = () => { try { return JSON.parse(sessionStorage.getItem(LOCK_KEY)) || { count: 0, until: 0 }; } catch { return { count: 0, until: 0 }; } };
  $('#login').addEventListener('submit', (e) => {
    e.preventDefault();
    const attempts = getAttempts();
    if (attempts.until > Date.now()) { err.textContent = `Too many failed attempts. Try again in ${Math.ceil((attempts.until-Date.now())/1000)} seconds.`; return; }
    const r = Auth.login(idEl.value, pwEl.value);
    if (r.ok) { sessionStorage.removeItem(LOCK_KEY); idEl.setAttribute('aria-invalid','false'); location.href = r.to; return; }
    attempts.count += 1; if (attempts.count >= 5) { attempts.count = 0; attempts.until = Date.now() + 30000; } sessionStorage.setItem(LOCK_KEY, JSON.stringify(attempts));
    idEl.setAttribute('aria-invalid', 'true');
    err.textContent = attempts.until > Date.now() ? 'Too many failed attempts. Please wait 30 seconds.' : 'That email or password is not right. Check it and try again.';
  });
})();
