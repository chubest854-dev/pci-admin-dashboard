/* js/ui.js — shared UI helpers: escaping, formatting, icons, toasts, dialogs, empty states. */
const UI = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const naira = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
  const date = (iso) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const PATHS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    wallet: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    staff: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/><path d="M21 12a9 9 0 1 1-5.3-8.2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  };
  const icon = (name, size = 22) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  const badge = (label, tone = 'info') => `<span class="badge badge-${tone}">${esc(label)}</span>`;

  function toast(msg, tone = 'info') {
    let box = document.getElementById('toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + tone;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 3500);
  }

  /* Resolves true if the person confirms. Uses native <dialog>: focus trap and Esc come free. */
  function confirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.innerHTML = `<form method="dialog" class="dlg"><h2>${esc(title)}</h2><p>${esc(message)}</p>
        <div class="dlg-actions"><button class="btn btn-ghost" value="no">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="yes">${esc(confirmLabel)}</button></div></form>`;
      document.body.appendChild(d);
      d.addEventListener('close', () => { resolve(d.returnValue === 'yes'); d.remove(); });
      d.showModal();
    });
  }

  function modal(html) {
    const d = document.createElement('dialog');
    d.innerHTML = `<div class="dlg">${html}<div class="dlg-actions no-print"><button class="btn btn-ghost" data-close>Close</button></div></div>`;
    d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) d.close(); });
    d.addEventListener('close', () => d.remove());
    document.body.appendChild(d);
    d.showModal();
    return d;
  }

  const empty = ({ title, text, actionLabel, actionHref }) =>
    `<div class="empty"><h3>${esc(title)}</h3><p>${esc(text)}</p>${actionLabel ? `<a class="btn btn-primary" href="${esc(actionHref)}">${esc(actionLabel)}</a>` : ''}</div>`;

  /* Real-time validation: fn(value) returns '' when valid or an error message. */
  function liveValidate(input, fn) {
    const err = input.closest('.field').querySelector('.field-error');
    const run = () => {
      const m = input.value ? fn(input.value) : '';
      input.setAttribute('aria-invalid', m ? 'true' : 'false');
      if (err) err.textContent = m;
      return m;
    };
    input.addEventListener('input', run);
    return run;
  }

  return { esc, naira, date, icon, badge, toast, confirm, modal, empty, liveValidate };
})();
