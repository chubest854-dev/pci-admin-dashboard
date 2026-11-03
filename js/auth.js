/* Browser-based sign-in/session helpers and role permissions for this HTML/CSS/JS project.
   These checks are suitable for a coursework prototype only, not production security. */
const Auth = (() => {
  const KEY = 'pci_session';
  const PERMISSIONS = {
    admin: ['dashboard:view','reports:view','settings:view','settings:edit','notices:view','notices:edit','students:view','students:edit','faculties:view','faculties:edit','courses:view','courses:edit','registration:view','registration:edit','allocations:view','allocations:edit','leadership:view','leadership:edit','transcripts:view','transcripts:issue','results:edit','staff:view','staff:edit','finance:view','finance:edit','audit:view'],
    registrar: ['dashboard:view','reports:view','notices:view','notices:edit','students:view','students:edit','faculties:view','faculties:edit','courses:view','courses:edit','registration:view','registration:edit','allocations:view','allocations:edit','leadership:view','leadership:edit','transcripts:view','transcripts:issue','results:edit'],
    bursar: ['dashboard:view','reports:view','students:view','finance:view','finance:edit'],
    lecturer: ['dashboard:view','courses:view']
  };
  const save = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
  const rawSession = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } };

  const IDLE_LIMIT = 30 * 60 * 1000;
  function session() {
    const s = rawSession();
    if (!s || typeof DB === 'undefined') return null;
    if (s.lastActivity && Date.now() - s.lastActivity > IDLE_LIMIT) { sessionStorage.removeItem(KEY); return null; }
    const collection = s.type === 'student' ? 'students' : 'staff';
    const record = DB.find(collection, s.id);
    if (!record || record.status === 'Retired' || record.status === 'Suspended' || record.status === 'Inactive') {
      sessionStorage.removeItem(KEY);
      return null;
    }
    // Never trust a role stored in sessionStorage; derive it from the current record.
    const role = s.type === 'student' ? 'student' : String(record.role || '').toLowerCase();
    const refreshed = { type: s.type, id: record.id, role, lastActivity: Date.now() };
    save(refreshed);
    return refreshed;
  }

  /* One sign-in for the whole portal: the administrator. Accepts the email, or just "admin". */
  function login(identifier, password) {
    let id = String(identifier || '').trim().toLowerCase();
    if (id === 'admin') id = 'admin@pci.edu';
    const pass = String(password || '').trim();
    const admin = DB.get('staff').find(x => String(x.role || '').toLowerCase() === 'admin' && String(x.email || '').toLowerCase() === id && x.password === pass && x.status === 'Active');
    if (admin) { save({ type: 'staff', id: admin.id, role: 'admin', lastActivity: Date.now() }); return { ok: true, to: 'admin.html' }; }
    return { ok: false };
  }

  function can(permission, candidate) {
    const s = candidate || session();
    if (!s) return false;
    if (s.role === 'student') return permission === 'student:portal' || permission === 'student:transcript:view';
    return (PERMISSIONS[s.role] || []).includes(permission);
  }
  function require(roles) {
    const s = session();
    if (!s || !roles.includes(s.role)) { location.replace('index.html'); return null; }
    return s;
  }
  function requirePermission(permission) {
    const s = session();
    if (!s) { location.replace('index.html'); return null; }
    if (!can(permission, s)) { location.replace('admin.html#/overview'); return null; }
    return s;
  }
  function logout() { sessionStorage.removeItem(KEY); location.replace('index.html'); }
  return { login, session, require, requirePermission, can, logout, permissions: PERMISSIONS };
})();
