/* js/db.js — the "database". All reads/writes to localStorage go through here.
   Tables are JSON arrays linked by IDs. Balances and CGPA are CALCULATED, never stored. */
const DB = (() => {
  const P = 'pci_';
  const DEFAULT_CONFIG = { session: '2026/2027', semester: 'First', maxUnits: 24, minPaidPercent: 50, passMark: 40, registrationOpen: true, levels: [100, 200, 300, 400, 500], semesters: ['First', 'Second'] };
  const CONFIG = (() => { try { const saved = JSON.parse(localStorage.getItem(P + 'config')) || {}; return { ...DEFAULT_CONFIG, ...saved, levels: Array.isArray(saved.levels) && saved.levels.length ? [...new Set(saved.levels.map(Number).filter(Number.isFinite))].sort((a,b)=>a-b) : [...DEFAULT_CONFIG.levels], semesters: Array.isArray(saved.semesters) && saved.semesters.length ? [...new Set(saved.semesters.map(String).filter(Boolean))] : [...DEFAULT_CONFIG.semesters] }; } catch { return { ...DEFAULT_CONFIG, levels: [...DEFAULT_CONFIG.levels] }; } })();
  const saveConfig = (patch) => { Object.assign(CONFIG, patch); localStorage.setItem(P + 'config', JSON.stringify(CONFIG)); return CONFIG; };

  /* ---------- generic table helpers ---------- */
  const get = (t) => { try { return JSON.parse(localStorage.getItem(P + t)) || []; } catch { return []; } };
  const set = (t, rows) => localStorage.setItem(P + t, JSON.stringify(rows));
  const find = (t, id) => get(t).find((r) => r.id === id);
  const insert = (t, row) => { const rows = get(t); rows.push(row); set(t, rows); return row; };
  const update = (t, id, patch) => set(t, get(t).map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (t, id) => set(t, get(t).filter((r) => r.id !== id));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------- seed data (SAMPLE DATA LIVES HERE: edit freely) ---------- */
  const seedData = () => ({
    faculties: [
      { id: 'F1', name: 'Science' },
      { id: 'F2', name: 'Social and Management Sciences' },
    ],
    departments: [
      { id: 'D1', facultyId: 'F1', name: 'Computer Science', code: 'CS' },
      { id: 'D2', facultyId: 'F1', name: 'Biochemistry', code: 'BCH' },
      { id: 'D3', facultyId: 'F2', name: 'Accounting', code: 'ACC' },
      { id: 'D4', facultyId: 'F2', name: 'Mass Communication', code: 'MCM' },
    ],
    programmes: [
      { id: 'PR1', name: 'B.Sc. Computer Science', code: 'BSC-CS', departmentId: 'D1', durationYears: 4, award: 'B.Sc.', status: 'Proposed' },
      { id: 'PR2', name: 'B.Sc. Biochemistry', code: 'BSC-BCH', departmentId: 'D2', durationYears: 4, award: 'B.Sc.', status: 'Proposed' },
      { id: 'PR3', name: 'B.Sc. Accounting', code: 'BSC-ACC', departmentId: 'D3', durationYears: 4, award: 'B.Sc.', status: 'Proposed' },
      { id: 'PR4', name: 'B.Sc. Mass Communication', code: 'BSC-MCM', departmentId: 'D4', durationYears: 4, award: 'B.Sc.', status: 'Proposed' },
    ],
    curricula: [],
    staff: [
      { id: 'S1', name: 'Dr. Ada Okonkwo', role: 'Admin', departmentId: null, email: 'admin@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'S2', name: 'Mrs. Ngozi Eze', role: 'Bursar', departmentId: null, email: 'bursar@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'S3', name: 'Mr. Ibrahim Sani', role: 'Registrar', departmentId: null, email: 'registrar@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'T1', name: 'Dr. Grace Adeyemi', role: 'Lecturer', departmentId: 'D1', email: 'lecturer@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'T2', name: 'Prof. Samuel Obi', role: 'Lecturer', departmentId: 'D1', email: 'obi@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'T3', name: 'Dr. Halima Musa', role: 'Lecturer', departmentId: 'D1', email: 'musa@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'T4', name: 'Dr. Peter Nwosu', role: 'Lecturer', departmentId: 'D2', email: 'nwosu@pci.edu', password: 'PciPortal26!', status: 'Active' },
      { id: 'T5', name: 'Mr. Tunde Bakare', role: 'Lecturer', departmentId: 'D3', email: 'bakare@pci.edu', password: 'PciPortal26!', status: 'On leave' },
      { id: 'T6', name: 'Ms. Joy Ekanem', role: 'Lecturer', departmentId: 'D4', email: 'ekanem@pci.edu', password: 'PciPortal26!', status: 'Active' },
    ],
    courses: [
      { id: 'C1', code: 'CSC 101', title: 'Introduction to Computer Science', units: 3, level: 100, semester: 'First', type: 'Core', departmentId: 'D1', lecturerId: 'T1', capacity: 60, prerequisiteId: null },
      { id: 'C2', code: 'MTH 101', title: 'Elementary Mathematics I', units: 3, level: 100, semester: 'First', type: 'Core', departmentId: 'D1', lecturerId: 'T2', capacity: 60, prerequisiteId: null },
      { id: 'C3', code: 'CSC 201', title: 'Data Structures', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D1', lecturerId: 'T1', capacity: 50, prerequisiteId: 'C1' },
      { id: 'C4', code: 'CSC 203', title: 'Computer Architecture', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D1', lecturerId: 'T1', capacity: 50, prerequisiteId: null },
      { id: 'C5', code: 'CSC 205', title: 'Operating Systems I', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D1', lecturerId: 'T3', capacity: 50, prerequisiteId: 'C3' },
      { id: 'C6', code: 'MTH 201', title: 'Linear Algebra', units: 2, level: 200, semester: 'First', type: 'Elective', departmentId: 'D1', lecturerId: 'T2', capacity: 2, prerequisiteId: null },
      { id: 'C7', code: 'BCH 201', title: 'General Biochemistry', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D2', lecturerId: 'T4', capacity: 50, prerequisiteId: null },
      { id: 'C8', code: 'ACC 201', title: 'Financial Accounting', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D3', lecturerId: 'T5', capacity: 50, prerequisiteId: null },
      { id: 'C9', code: 'MCM 201', title: 'Media Writing', units: 3, level: 200, semester: 'First', type: 'Core', departmentId: 'D4', lecturerId: 'T6', capacity: 50, prerequisiteId: null },
    ],
    students: [
      { id: 'ST1', matNo: 'PCI/26/CS/001', name: 'Amina Yusuf', email: 'amina@student.pci.edu', password: 'PciPortal26!', departmentId: 'D1', level: 200, status: 'Active', registeredCourses: ['C3'], results: [{ courseId: 'C1', score: 68 }, { courseId: 'C2', score: 74 }] },
      { id: 'ST2', matNo: 'PCI/26/CS/002', name: 'Chinedu Okafor', email: 'chinedu@student.pci.edu', password: 'PciPortal26!', departmentId: 'D1', level: 200, status: 'Active', registeredCourses: ['C4', 'C6'], results: [{ courseId: 'C1', score: 55 }, { courseId: 'C2', score: 61 }] },
      { id: 'ST3', matNo: 'PCI/26/CS/003', name: 'Fatima Bello', email: 'fatima@student.pci.edu', password: 'PciPortal26!', departmentId: 'D1', level: 200, status: 'Active', registeredCourses: ['C6'], results: [{ courseId: 'C1', score: 49 }] },
      { id: 'ST4', matNo: 'PCI/26/ACC/001', name: 'David Mark', email: 'david@student.pci.edu', password: 'PciPortal26!', departmentId: 'D3', level: 100, status: 'Active', registeredCourses: [], results: [] },
    ],
    fees: [
      { id: 'FE1', facultyId: 'F1', session: '2026/2027', items: [{ name: 'Tuition', amount: 150000 }, { name: 'ICT', amount: 15000 }, { name: 'Examination', amount: 10000 }] },
      { id: 'FE2', facultyId: 'F2', session: '2026/2027', items: [{ name: 'Tuition', amount: 120000 }, { name: 'ICT', amount: 15000 }, { name: 'Examination', amount: 10000 }] },
    ],
    payments: [
      { id: 'P1', studentId: 'ST1', amount: 175000, method: 'Transfer', reference: 'TRF-1001', date: '2026-09-15T10:00:00.000Z', status: 'confirmed', recordedBy: 'S2' },
      { id: 'P2', studentId: 'ST2', amount: 100000, method: 'POS', reference: 'POS-2044', date: '2026-09-18T12:30:00.000Z', status: 'confirmed', recordedBy: 'S2' },
      { id: 'P3', studentId: 'ST4', amount: 145000, method: 'Transfer', reference: 'TRF-1015', date: '2026-09-20T09:15:00.000Z', status: 'confirmed', recordedBy: 'S2' },
    ],
    notices: [
      { id: 'N1', title: 'Fees deadline: 30 November 2026', body: 'Pay at least half your fees to unlock course registration.', date: '2026-10-01T08:00:00.000Z' },
      { id: 'N2', title: 'First semester registration is open', body: 'Register before the credit limit lock on 15 November.', date: '2026-10-10T08:00:00.000Z' },
    ],
    leadership: [],
    registrations: [],
    transcripts: [],
    courseResults: [],
    audit: [],
    financeTransactions: [],
    payroll: [],
    budgets: [],
    chartOfAccounts: [
      { id:'COA1000', code:'1000', name:'Cash and Bank', type:'Asset', normalBalance:'Debit', system:true, active:true },
      { id:'COA1100', code:'1100', name:'Student Fees Receivable', type:'Asset', normalBalance:'Debit', system:true, active:true },
      { id:'COA1200', code:'1200', name:'Equipment and Assets', type:'Asset', normalBalance:'Debit', system:false, active:true },
      { id:'COA2000', code:'2000', name:'Accounts Payable', type:'Liability', normalBalance:'Credit', system:true, active:true },
      { id:'COA2100', code:'2100', name:'Payroll and Statutory Deductions Payable', type:'Liability', normalBalance:'Credit', system:true, active:true },
      { id:'COA3000', code:'3000', name:'Accumulated Funds / Equity', type:'Equity', normalBalance:'Credit', system:true, active:true },
      { id:'COA4000', code:'4000', name:'Tuition and Academic Fees Income', type:'Income', normalBalance:'Credit', system:true, active:true },
      { id:'COA4100', code:'4100', name:'Grants and Donations Income', type:'Income', normalBalance:'Credit', system:false, active:true },
      { id:'COA4200', code:'4200', name:'Accommodation and Other Services Income', type:'Income', normalBalance:'Credit', system:false, active:true },
      { id:'COA5000', code:'5000', name:'Salaries and Wages Expense', type:'Expense', normalBalance:'Debit', system:true, active:true },
      { id:'COA5100', code:'5100', name:'Utilities Expense', type:'Expense', normalBalance:'Debit', system:false, active:true },
      { id:'COA5200', code:'5200', name:'Repairs and Maintenance Expense', type:'Expense', normalBalance:'Debit', system:false, active:true },
      { id:'COA5300', code:'5300', name:'Teaching and Office Supplies Expense', type:'Expense', normalBalance:'Debit', system:false, active:true },
      { id:'COA5400', code:'5400', name:'Transport and Operations Expense', type:'Expense', normalBalance:'Debit', system:false, active:true },
      { id:'COA5500', code:'5500', name:'IT and Communications Expense', type:'Expense', normalBalance:'Debit', system:false, active:true },
    ],
    journalEntries: [],
  });

  function seed() {
    Object.entries(seedData()).forEach(([t, rows]) => set(t, rows));
    localStorage.setItem(P + 'seeded', 'v1');
  }
  function reset() {
    Object.keys(seedData()).forEach((t) => localStorage.removeItem(P + t));
    localStorage.removeItem(P + 'academicSessions');
    localStorage.removeItem(P + 'verificationExercises');
    localStorage.removeItem(P + 'verificationRecords');
    localStorage.removeItem(P + 'seeded');
    localStorage.removeItem(P + 'config');
    Object.assign(CONFIG, DEFAULT_CONFIG);
    seed();
    set('academicSessions', [{ id: 'AS-2026-2027', name: CONFIG.session, startDate: '2026-09-01', endDate: '2027-07-31', status: 'Active', semesters: (CONFIG.semesters || ['First','Second']).map(name => ({ name, startDate: '', endDate: '', registrationOpen: true })), createdAt: new Date().toISOString() }]);
    ensureAdmin();
    syncRegistrations();
  }

  /* ---------- business rules (derived data) ---------- */
  const gradeFor = (score) =>
    score >= 70 ? { letter: 'A', points: 5 } : score >= 60 ? { letter: 'B', points: 4 } :
    score >= 50 ? { letter: 'C', points: 3 } : score >= 45 ? { letter: 'D', points: 2 } :
    score >= 40 ? { letter: 'E', points: 1 } : { letter: 'F', points: 0 };

  function cgpa(student) {
    let pts = 0, units = 0;
    (student.results || []).forEach((r) => {
      const c = find('courses', r.courseId);
      if (!c) return;
      pts += gradeFor(r.score).points * c.units;
      units += c.units;
    });
    return units ? pts / units : null;
  }

  /* ---------- results management: CA 30 + exam 70, five-point scale ----------
     Official GPA/transcripts use approved courseResults only. Legacy student.results are preserved
     for compatibility but are not silently treated as approved official results. */
  function courseResultFor(studentId, courseId, session = CONFIG.session, semester = CONFIG.semester) {
    return get('courseResults').find(r => r.studentId === studentId && r.courseId === courseId && r.session === session && r.semester === semester) || null;
  }
  function saveCourseResult(input = {}, actor = {}) {
    const student = find('students', input.studentId), course = find('courses', input.courseId);
    const session = String(input.session || CONFIG.session), semester = String(input.semester || CONFIG.semester);
    if (!student || !course) return fail('Choose a valid student and course.');
    if (!semester || !session) return fail('Academic session and semester are required.');
    const academic = get('academicSessions').find(x => x.name === session);
    if (academic?.status === 'Archived') return fail('Results cannot be edited in an archived academic session.');
    if (course.semester && course.semester !== semester) return fail(`${course.code} is not configured for ${semester} semester.`);
    const registered = getStudentRegistrationCourses(student.id, session, semester).includes(course.id);
    if (!registered) return fail(`${student.matNo} is not registered for ${course.code} in ${session}, ${semester} semester.`);
    if (input.ca === '' || input.ca === null || input.ca === undefined || input.exam === '' || input.exam === null || input.exam === undefined) return fail('Both CA and examination scores are required.');
    const ca = Number(input.ca), exam = Number(input.exam);
    if (!Number.isFinite(ca) || ca < 0 || ca > 30) return fail('CA score must be between 0 and 30.');
    if (!Number.isFinite(exam) || exam < 0 || exam > 70) return fail('Examination score must be between 0 and 70.');
    const existing = courseResultFor(student.id, course.id, session, semester);
    if (existing && ['Submitted','Approved','Published'].includes(existing.status)) return fail('This result is already submitted or approved. Reopen it through the authorized correction workflow first.');
    const now = new Date().toISOString(), total = Math.round((ca + exam) * 100) / 100, grade = gradeFor(total);
    const row = { ...(existing || {}), id: existing?.id || uid('RES'), studentId: student.id, courseId: course.id, session, semester, caScore: ca, examScore: exam, totalScore: total, grade: grade.letter, gradePoint: grade.points, creditUnits: Number(course.units || 0), status: 'Draft', updatedAt: now, updatedBy: actor.id || null, createdAt: existing?.createdAt || now };
    if (existing) update('courseResults', existing.id, row); else insert('courseResults', row);
    log(actor.name || 'System', `Saved draft result for ${student.matNo} in ${course.code} (${session}, ${semester})`);
    return { ok: true, result: row };
  }
  function submitCourseResults(courseId, session = CONFIG.session, semester = CONFIG.semester, actor = {}) {
    const course = find('courses', courseId); if (!course) return fail('Course not found.');
    const registered = get('students').filter(st => getStudentRegistrationCourses(st.id, session, semester).includes(courseId));
    if (!registered.length) return fail('No students are registered for this course in the selected academic period.');
    const rows = registered.map(st => courseResultFor(st.id, courseId, session, semester));
    const missing = registered.filter((st, i) => !rows[i] || !Number.isFinite(Number(rows[i].caScore)) || !Number.isFinite(Number(rows[i].examScore)) || !['Draft','Rejected'].includes(rows[i].status));
    if (missing.length) return fail(`Cannot submit yet. ${missing.length} registered student(s) need a valid draft score or need their existing result resolved.`);
    const now = new Date().toISOString();
    transaction(['courseResults','audit'], () => {
      rows.forEach(r => update('courseResults', r.id, { status: 'Submitted', submittedAt: now, submittedBy: actor.id || null, updatedAt: now }));
      log(actor.name || 'System', `Submitted ${rows.length} results for ${course.code} (${session}, ${semester}) for HOD / Results Officer review`);
    });
    return { ok: true, count: rows.length };
  }
  function approveCourseResults(courseId, session = CONFIG.session, semester = CONFIG.semester, actor = {}) {
    const actorRole = String(actor.role || '').toLowerCase();
    if (!['admin','hod','results officer'].includes(actorRole)) return fail('Only an HOD, Results Officer, or an administrator acting in the prototype can approve results.');
    const course = find('courses', courseId); if (!course) return fail('Course not found.');
    const rows = get('courseResults').filter(r => r.courseId === courseId && r.session === session && r.semester === semester && r.status === 'Submitted');
    if (!rows.length) return fail('There are no submitted results awaiting approval for this course and academic period.');
    const now = new Date().toISOString();
    transaction(['courseResults','audit'], () => {
      rows.forEach(r => update('courseResults', r.id, { status: 'Approved', approvedAt: now, approvedBy: actor.id || null, approvedByName: actor.name || 'Authorized Results Officer', updatedAt: now }));
      log(actor.name || 'System', `Approved ${rows.length} results for ${course.code} (${session}, ${semester})`);
    });
    return { ok: true, count: rows.length };
  }
  function approvedResults(studentId) {
    return get('courseResults').filter(r => r.studentId === studentId && ['Approved','Published'].includes(r.status)).sort((a,b) => String(a.session).localeCompare(String(b.session)) || String(a.semester).localeCompare(String(b.semester)) || String((find('courses',a.courseId)||{}).code).localeCompare(String((find('courses',b.courseId)||{}).code)));
  }
  function gpaForResults(rows) {
    let quality = 0, units = 0;
    rows.forEach(r => { const c = find('courses', r.courseId), u = Number(r.creditUnits ?? c?.units ?? 0), gp = Number(r.gradePoint ?? gradeFor(r.totalScore ?? r.score).points); if (u > 0 && Number.isFinite(gp)) { quality += u * gp; units += u; } });
    return units ? quality / units : null;
  }
  function semesterGPA(studentId, session, semester) { return gpaForResults(approvedResults(studentId).filter(r => r.session === session && r.semester === semester)); }
  function cumulativeGPA(studentId) { return gpaForResults(approvedResults(studentId)); }
  function issueTranscript(studentId, actor = {}) {
    const student = find('students', studentId); if (!student) return fail('Student not found.');
    const results = approvedResults(studentId); if (!results.length) return fail('A transcript cannot be issued until the student has approved results.');
    const now = new Date().toISOString(), existing = get('transcripts').find(t => t.studentId === studentId);
    const row = { ...(existing || {}), id: existing?.id || uid('TR'), studentId, status: 'Issued', issuedAt: now, issuedBy: actor.id || null, issuedByName: actor.name || 'Authorized administrator', resultCount: results.length, session: CONFIG.session, cgpa: cumulativeGPA(studentId) };
    if (existing) update('transcripts', existing.id, row); else insert('transcripts', row);
    log(actor.name || 'System', `Issued transcript based on ${results.length} approved results for ${student.matNo}`);
    return { ok: true, transcript: row };
  }

  function finance(student, academicSession = CONFIG.session) {
    const dept = find('departments', student.departmentId);
    const feeRows = dept ? get('fees').filter((f) => f.session === academicSession && (f.departmentId ? f.departmentId === dept.id : f.facultyId === dept.facultyId)) : [];
    // Prefer a level-specific structure, then fall back to a faculty-wide structure.
    const fee = feeRows.find((f) => Number(f.level) === Number(student.level)) || feeRows.find((f) => !f.level || f.level === 'all');
    const total = fee ? fee.items.reduce((a, i) => a + Number(i.amount || 0), 0) : 0;
    const payments = get('payments').filter((p) => p.studentId === student.id && p.status === 'confirmed' && (p.session || CONFIG.session) === academicSession);
    const paid = payments.reduce((a, p) => a + p.amount, 0);
    const balance = Math.max(total - paid, 0);
    const percent = total ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    const credit = Math.max(paid - total, 0); // paid more than the current assessment (e.g. fee structure was reduced)
    const label = !fee || total <= 0 ? 'No fee structure' : balance === 0 ? 'Cleared' : paid > 0 ? 'Outstanding balance' : 'Unpaid';
    const tone = label === 'Cleared' ? 'ok' : label === 'Outstanding balance' ? 'warn' : label === 'No fee structure' ? 'info' : 'bad';
    const statusKey = label === 'Cleared' ? 'cleared' : label === 'Outstanding balance' ? 'outstanding' : label === 'No fee structure' ? 'no-fee' : 'unpaid';
    return { fee, total, paid, balance, credit, percent, label, tone, statusKey, payments, blocked: !fee || percent < CONFIG.minPaidPercent };
  }

  const registrationCourseIds = (studentId, session = CONFIG.session, semester = CONFIG.semester) => { const row = get('registrations').find(r => r.studentId === studentId && r.session === session && r.semester === semester); return row ? [...(row.courseIds || [])] : (session === CONFIG.session ? get('students').find(s => s.id === studentId)?.registeredCourses || [] : [] ).filter(id => { const c = find('courses', id); return c && c.semester === semester; }); };
  const seatsTaken = (courseId, session = CONFIG.session) => { const rows = get('registrations').filter(r => r.session === session && (r.courseIds || []).includes(courseId)); if (rows.length) return new Set(rows.map(r => r.studentId)).size; return get('students').filter(s => (s.registeredCourses || []).includes(courseId)).length; };
  const registeredUnits = (student) =>
    registrationCourseIds(student.id, CONFIG.session, CONFIG.semester).reduce((a, id) => a + ((find('courses', id) || {}).units || 0), 0);
  const passed = (student, courseId) => (student.results || []).some((r) => r.courseId === courseId && r.score >= CONFIG.passMark);

  /* Registration rules, checked in this order so the student sees the most useful reason first. */
  function canRegister(student, course) {
    const f = finance(student);
    if (!CONFIG.registrationOpen) return { ok: false, reason: 'Course registration is currently closed.' };
    if (f.blocked) return { ok: false, reason: `Pay at least ${CONFIG.minPaidPercent}% of your fees to register.` };
    if (course.prerequisiteId && !passed(student, course.prerequisiteId)) {
      const p = find('courses', course.prerequisiteId);
      return { ok: false, reason: `Needs ${p ? p.code : 'a prerequisite'} first.` };
    }
    if (seatsTaken(course.id) >= course.capacity) return { ok: false, reason: 'This course is full.' };
    if (registeredUnits(student) + course.units > CONFIG.maxUnits)
      return { ok: false, reason: `This would pass the ${CONFIG.maxUnits}-unit limit.` };
    return { ok: true };
  }

  /* Unique mat number, e.g. PCI/26/CS/001 */
  function nextMatNo(deptId) {
    const dept = find('departments', deptId);
    const yy = CONFIG.session.slice(2, 4);
    const all = get('students').map((s) => s.matNo);
    let n = get('students').filter((s) => s.departmentId === deptId).length + 1;
    let mat;
    do { mat = `PCI/${yy}/${dept.code}/${String(n++).padStart(3, '0')}`; } while (all.includes(mat));
    return mat;
  }

  const log = (by, action) => insert('audit', { id: uid('A'), at: new Date().toISOString(), by, action });

  const money = (n) => '\u20a6' + Number(n || 0).toLocaleString('en-NG');
  const fail = (reason) => ({ ok: false, reason });

  /* ---------- atomic multi-table writes ----------
     localStorage has no transactions, so we snapshot the raw text of every table we are about to
     touch and put it back if anything throws (for example the browser storage is full). */
  function transaction(tables, work) {
    const snap = tables.map((t) => [t, localStorage.getItem(P + t)]);
    try { return work(); }
    catch (err) {
      snap.forEach(([t, raw]) => { try { raw === null ? localStorage.removeItem(P + t) : localStorage.setItem(P + t, raw); } catch (_) { /* nothing more we can do */ } });
      throw err;
    }
  }

  /* ---------- session-aware course registration ----------
     Each student has a separate record per academic session AND semester.
     students.registeredCourses is maintained only as a compatibility cache for current-session screens. */
  function getRegistration(studentId, session = CONFIG.session, semester = CONFIG.semester) {
    return get('registrations').find(r => r.studentId === studentId && r.session === session && r.semester === semester) || null;
  }
  function getStudentRegistrationCourses(studentId, session = CONFIG.session, semester = CONFIG.semester) {
    return registrationCourseIds(studentId, session, semester);
  }
  function saveRegistration(studentId, courseIds, by = {}) {
    const student = find('students', studentId);
    if (!student) return fail('Student record not found.');
    const semester = by.semester || CONFIG.semester;
    const session = by.session || CONFIG.session;
    if (!(CONFIG.semesters || ['First','Second']).includes(semester)) return fail('Choose a valid configured semester.');
    const academic = get('academicSessions').find(x => x.name === session);
    if (academic && academic.status === 'Archived') return fail('This academic session is archived and cannot be edited.');
    const semConfig = academic?.semesters?.find(x => x.name === semester);
    if (!CONFIG.registrationOpen || semConfig?.registrationOpen === false) return fail('Course registration is currently closed for this session and semester.');
    const requested = [...new Set(courseIds || [])];
    const old = getStudentRegistrationCourses(studentId, session, semester);
    const added = requested.filter(id => !old.includes(id));
    const dropped = old.filter(id => !requested.includes(id));
    if (!added.length && !dropped.length) return { ok: true, unchanged: true };
    if (added.length && finance(student).blocked) return fail(`Pay at least ${CONFIG.minPaidPercent}% of fees before registering for courses.`);
    for (const id of requested) {
      const c = find('courses', id);
      if (!c) return fail('A selected course no longer exists.');
      if (c.departmentId !== student.departmentId || Number(c.level) !== Number(student.level) || c.semester !== semester)
        return fail(`${c.code} does not match the student's department, level or selected semester.`);
    }
    for (const id of added) {
      const c = find('courses', id);
      if (c.prerequisiteId && !passed(student, c.prerequisiteId)) { const pre = find('courses', c.prerequisiteId); return fail(`${c.code} requires ${pre ? pre.code : 'a prerequisite'} first.`); }
      if (seatsTaken(id, session) >= c.capacity) return fail(`${c.code} is full.`);
    }
    const units = requested.reduce((n, id) => n + ((find('courses', id) || {}).units || 0), 0);
    if (units > CONFIG.maxUnits) return fail(`Selected courses total ${units} units, above the ${CONFIG.maxUnits}-unit limit for ${semester.toLowerCase()} semester.`);
    const now = new Date().toISOString();
    transaction(['students', 'registrations', 'audit'], () => {
      const rest = get('registrations').filter(r => !(r.studentId === student.id && r.session === session && r.semester === semester));
      if (requested.length) rest.push({ id: getRegistration(student.id, session, semester)?.id || uid('R'), studentId: student.id, session, semester, courseIds: requested, status: 'Recorded', updatedAt: now, updatedBy: by.id || student.id, createdAt: getRegistration(student.id, session, semester)?.createdAt || now });
      set('registrations', rest);
      const currentRows = rest.filter(r => r.studentId === student.id && r.session === CONFIG.session);
      const cached = [...new Set(currentRows.flatMap(r => r.courseIds || []))];
      update('students', student.id, { registeredCourses: cached });
      log(by.name || student.name, by.note || `Updated ${semester.toLowerCase()} semester course registration for ${student.matNo} (${session})`);
    });
    return { ok: true, added: added.length, dropped: dropped.length, semester, session };
  }

  /* Migrate older one-row-per-student/session records into one row per student/session/semester.
     Existing course IDs and historical sessions are preserved. */
  function syncRegistrations() {
    let changed = false;
    const rows = [];
    const seen = new Set();
    const push = row => {
      const key = `${row.studentId}|${row.session}|${row.semester}`;
      if (seen.has(key)) { const old = rows.find(r => `${r.studentId}|${r.session}|${r.semester}` === key); old.courseIds = [...new Set([...(old.courseIds || []), ...(row.courseIds || [])])]; changed = true; }
      else { seen.add(key); rows.push(row); }
    };
    get('registrations').forEach(r => {
      if (r.semester) { push({ ...r, courseIds: [...(r.courseIds || [])] }); return; }
      const bySemester = new Map();
      (r.courseIds || []).forEach(id => { const c = find('courses', id); const sem = c?.semester || CONFIG.semester; if (!bySemester.has(sem)) bySemester.set(sem, []); bySemester.get(sem).push(id); });
      bySemester.forEach((ids, semester) => { push({ ...r, id: uid('R'), semester, courseIds: ids, migratedAt: new Date().toISOString() }); changed = true; });
      if (!bySemester.size) changed = true;
    });
    // Seed legacy student registrations into the current session only when not already represented.
    get('students').forEach(st => {
      const grouped = new Map();
      (st.registeredCourses || []).forEach(id => { const c = find('courses', id); if (!c) return; if (!grouped.has(c.semester)) grouped.set(c.semester, []); grouped.get(c.semester).push(id); });
      grouped.forEach((ids, semester) => {
        const key = `${st.id}|${CONFIG.session}|${semester}`;
        if (!seen.has(key)) { push({ id: uid('R'), studentId: st.id, session: CONFIG.session, semester, courseIds: ids, status: 'Recorded', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'system-migration' }); changed = true; }
      });
    });
    if (changed || JSON.stringify(rows) !== JSON.stringify(get('registrations'))) set('registrations', rows);
    // Keep the legacy cache aligned to registrations in the current session.
    get('students').forEach(st => { const expected = [...new Set(rows.filter(r => r.studentId === st.id && r.session === CONFIG.session).flatMap(r => r.courseIds || []))]; if (JSON.stringify([...(st.registeredCourses || [])].sort()) !== JSON.stringify(expected.sort())) { update('students', st.id, { registeredCourses: expected }); changed = true; } });
    return changed;
  }

  function createAcademicSession(name, details = {}) {
    const normalized = String(name || '').trim();
    if (!/^\d{4}\/\d{4}$/.test(normalized) || Number(normalized.slice(5)) !== Number(normalized.slice(0,4)) + 1) return fail('Use consecutive academic years, e.g. 2027/2028.');
    const sessions = get('academicSessions');
    if (sessions.some(x => x.name.toLowerCase() === normalized.toLowerCase())) return fail('That academic session already exists.');
    const row = { id: uid('AS'), name: normalized, startDate: details.startDate || '', endDate: details.endDate || '', status: 'Planned', semesters: (CONFIG.semesters || ['First','Second']).map(name => ({ name, startDate: '', endDate: '', registrationOpen: false })), createdAt: new Date().toISOString() };
    insert('academicSessions', row); return { ok: true, session: row };
  }
  function updateAcademicSession(id, patch = {}) {
    const row = find('academicSessions', id); if (!row) return fail('Academic session not found.');
    if (row.status === 'Archived' && patch.status && patch.status !== 'Archived') return fail('Archived sessions cannot be reactivated in this prototype.');
    const next = { ...row, ...patch, id: row.id, name: row.name };
    if (patch.semesters) {
      const names = new Set(CONFIG.semesters || ['First','Second']);
      if (patch.semesters.some(s => !names.has(s.name) || (s.startDate && s.endDate && s.endDate < s.startDate))) return fail('Check semester names and date ranges.');
    }
    update('academicSessions', id, next); return { ok: true, session: next };
  }
  function activateAcademicSession(id) {
    const row = find('academicSessions', id); if (!row) return fail('Academic session not found.');
    if (row.status === 'Archived') return fail('Archived sessions cannot be activated.');
    update('academicSessions', id, { status: 'Active' });
    get('academicSessions').filter(x => x.id !== id && x.status === 'Active').forEach(x => update('academicSessions', x.id, { status: 'Planned' }));
    saveConfig({ session: row.name });
    // The legacy student cache represents the current session only; never copy old-session courses forward.
    get('students').forEach(st => { const ids = [...new Set(get('registrations').filter(r => r.studentId === st.id && r.session === row.name).flatMap(r => r.courseIds || []))]; update('students', st.id, { registeredCourses: ids }); });
    return { ok: true, session: row.name };
  }

  /* ---------- student payments: record + post to the journal in ONE step, void + reverse in ONE step ---------- */
  const ledgerAccount = (code) => get('chartOfAccounts').find((a) => String(a.code) === String(code) && a.active !== false);

  function recordPayment({ studentId, amount, method, reference, by = {} }) {
    const student = find('students', studentId);
    if (!student) return fail('Add a student before recording payments.');
    const f = finance(student), amt = Number(amount), ref = String(reference || '').trim();
    if (!Number.isSafeInteger(amt) || amt <= 0) return fail('Enter a positive whole-naira amount.');
    if (f.total <= 0) return fail('This student has no fee structure for the current session. Create one first.');
    if (amt > f.balance) return fail(`${student.name} only owes ${money(f.balance)}. Overpayments are not accepted.`);
    if (ref.length < 3) return fail('Enter a payment reference of at least 3 characters.');
    if (get('payments').some((p) => String(p.reference).toLowerCase() === ref.toLowerCase())) return fail('This reference was already used.');
    const cash = ledgerAccount('1000'), income = ledgerAccount('4000');
    if (!cash || !income) return fail('Payment not saved: ledger accounts 1000 (Cash and Bank) and 4000 (Tuition Income) must exist and be active so the receipt can be posted to the journal.');
    const now = new Date().toISOString();
    const payment = { id: uid('P'), studentId: student.id, session: CONFIG.session, amount: amt, method, reference: ref, date: now, status: 'confirmed', recordedBy: by.id };
    const entry = { id: uid('JE'), date: now.slice(0, 10), reference: `SRC-${payment.id}`, description: `Student fee receipt \u2014 ${student.matNo}`, debitAccountId: cash.id, creditAccountId: income.id, amount: amt, period: CONFIG.session, departmentId: null, status: 'Posted', sourceId: payment.id, sourceType: 'student-payment', createdBy: by.id, createdAt: now, postingMode: 'auto-on-confirm' };
    payment.journalId = entry.id;
    transaction(['payments', 'journalEntries', 'audit'], () => {
      insert('payments', payment);
      insert('journalEntries', entry);
      log(by.name, `Recorded ${money(amt)} for ${student.matNo} (${ref}) and posted it to the journal`);
    });
    return { ok: true, payment, entry };
  }

  /* Adds clearly labelled, non-destructive sample records for testing student-directory filters.
     Existing records are never reset or overwritten. Sample payments go through recordPayment so
     they also create the normal journal and audit records. */
  function addFilterTestData(by = {}) {
    const marker = P + 'filterTestData_v1';
    if (localStorage.getItem(marker) === 'added' || get('students').some((s) => String(s.id).startsWith('TEST-ST-'))) {
      return fail('Filter test data has already been added. No records were changed.');
    }
    const activeCash = get('chartOfAccounts').some((a) => String(a.code) === '1000' && a.active !== false);
    const activeIncome = get('chartOfAccounts').some((a) => String(a.code) === '4000' && a.active !== false);
    if (!activeCash || !activeIncome) return fail('Test records were not added because active Cash and Bank (1000) and Tuition Income (4000) accounts are required.');
    const samples = [
      { id:'TEST-ST-01', matNo:'PCI/26/CS/901', name:'[TEST] Adaeze Nwosu', email:'test.adaeze901@student.pci.edu', departmentId:'D1', level:100, status:'Active', payment:'unpaid' },
      { id:'TEST-ST-02', matNo:'PCI/26/CS/902', name:'[TEST] Malik Ibrahim', email:'test.malik902@student.pci.edu', departmentId:'D1', level:200, status:'Active', payment:'partial' },
      { id:'TEST-ST-03', matNo:'PCI/26/CS/903', name:'[TEST] Zainab Musa', email:'test.zainab903@student.pci.edu', departmentId:'D1', level:300, status:'Active', payment:'cleared' },
      { id:'TEST-ST-04', matNo:'PCI/26/BCH/901', name:'[TEST] Kelechi Eze', email:'test.kelechi901@student.pci.edu', departmentId:'D2', level:100, status:'Suspended', payment:'unpaid' },
      { id:'TEST-ST-05', matNo:'PCI/26/BCH/902', name:'[TEST] Sadiya Bello', email:'test.sadiya902@student.pci.edu', departmentId:'D2', level:200, status:'Active', payment:'partial' },
      { id:'TEST-ST-06', matNo:'PCI/26/BCH/903', name:'[TEST] Tobi Akin', email:'test.tobi903@student.pci.edu', departmentId:'D2', level:400, status:'Inactive', payment:'cleared' },
      { id:'TEST-ST-07', matNo:'PCI/26/ACC/901', name:'[TEST] Ifeoma Okafor', email:'test.ifeoma901@student.pci.edu', departmentId:'D3', level:100, status:'Active', payment:'partial' },
      { id:'TEST-ST-08', matNo:'PCI/26/ACC/902', name:'[TEST] Yusuf Danjuma', email:'test.yusuf902@student.pci.edu', departmentId:'D3', level:200, status:'Active', payment:'unpaid' },
      { id:'TEST-ST-09', matNo:'PCI/26/ACC/903', name:'[TEST] Amaka Chukwu', email:'test.amaka903@student.pci.edu', departmentId:'D3', level:300, status:'Suspended', payment:'cleared' },
      { id:'TEST-ST-10', matNo:'PCI/26/MCM/901', name:'[TEST] Farida Sule', email:'test.farida901@student.pci.edu', departmentId:'D4', level:100, status:'Active', payment:'cleared' },
      { id:'TEST-ST-11', matNo:'PCI/26/MCM/902', name:'[TEST] Daniel Umeh', email:'test.daniel902@student.pci.edu', departmentId:'D4', level:200, status:'Inactive', payment:'partial' },
      { id:'TEST-ST-12', matNo:'PCI/26/MCM/903', name:'[TEST] Esther Garba', email:'test.esther903@student.pci.edu', departmentId:'D4', level:400, status:'Active', payment:'unpaid' }
    ];
    const now = new Date().toISOString();
    samples.forEach((sample) => {
      const { payment, ...student } = sample;
      insert('students', { ...student, password:'TestOnly-NotForProduction!', registeredCourses:[], results:[], createdAt:now, testRecord:true });
    });
    const paymentSamples = samples.filter((s) => s.payment !== 'unpaid');
    for (const sample of paymentSamples) {
      const student = find('students', sample.id);
      const assessment = finance(student);
      const amount = sample.payment === 'cleared' ? assessment.total : Math.min(50000, Math.floor(assessment.total / 3));
      const result = recordPayment({ studentId:student.id, amount, method:'Transfer', reference:`TEST-${sample.id}-PAY`, by:{ id:by.id || 'S1', name:by.name || 'Admin (test data)' } });
      if (!result.ok) {
        log(by.name || 'Admin', `Test data payment for ${student.matNo} was not recorded: ${result.reason}`);
      }
    }
    localStorage.setItem(marker, 'added');
    log(by.name || 'Admin', 'Added 12 clearly labelled student filter-test records.');
    return { ok:true, count:samples.length, paid:paymentSamples.length };
  }

  /* Voiding keeps the payment record (never deleted), takes it out of the student's confirmed total,
     and reverses its journal entry. The person who recorded a payment cannot void it unless they are an Admin. */
  function voidPayment(paymentId, reason, actor = {}) {
    const pay = find('payments', paymentId);
    if (!pay) return fail('Payment not found.');
    if ((pay.status || 'confirmed') !== 'confirmed') return fail('Only confirmed payments can be voided.');
    const why = String(reason || '').trim();
    if (why.length < 5) return fail('A reason of at least 5 characters is required to void a payment.');
    if (pay.recordedBy && pay.recordedBy === actor.id && actor.role !== 'admin') return fail('You recorded this payment, so a different finance officer or an Admin must void it.');
    const now = new Date().toISOString();
    transaction(['payments', 'journalEntries', 'audit'], () => {
      update('payments', pay.id, { status: 'voided', voidedBy: actor.id, voidedAt: now, voidReason: why });
      const original = get('journalEntries').find((j) => j.sourceId === pay.id && j.sourceType === 'student-payment' && !j.reversedBy);
      if (original) {
        const reversal = { id: uid('JE'), date: now.slice(0, 10), reference: `REV-${original.reference}`, description: `Reversal of ${original.reference} (payment voided)`, period: original.period || CONFIG.session, status: 'Posted', sourceType: 'reversal', reversalOf: original.id, paymentId: pay.id, debitAccountId: original.creditAccountId, creditAccountId: original.debitAccountId, amount: Number(original.amount || 0), createdBy: actor.id, createdAt: now };
        if (get('journalEntries').some((j) => String(j.reference).toLowerCase() === reversal.reference.toLowerCase())) throw new Error('A reversal reference already exists for this payment.');
        insert('journalEntries', reversal);
        update('journalEntries', original.id, { reversedBy: reversal.id });
      }
      log(actor.name, `Voided payment ${pay.reference} (${money(pay.amount)}): ${why}${pay.reconciled ? ' [was marked reconciled]' : ''}${original ? '' : ' [no journal entry existed to reverse]'}`);
    });
    return { ok: true };
  }

  if (localStorage.getItem(P + 'seeded') !== 'v1') seed();
  // Add newly introduced academic tables to existing browser installs without resetting other records.
  if (localStorage.getItem(P + 'programmes') === null) set('programmes', seedData().programmes);
  ['financeTransactions', 'payroll', 'budgets', 'journalEntries', 'courseResults'].forEach((table) => { if (localStorage.getItem(P + table) === null) set(table, []); });
  if (localStorage.getItem(P + 'academicSessions') === null) set('academicSessions', [{ id: 'AS-2026-2027', name: CONFIG.session, startDate: '2026-09-01', endDate: '2027-07-31', status: 'Active', semesters: [{ name: 'First', startDate: '2026-09-01', endDate: '2027-01-31', registrationOpen: true }, { name: 'Second', startDate: '2027-02-01', endDate: '2027-07-31', registrationOpen: true }], createdAt: new Date().toISOString() }]);
  if (localStorage.getItem(P + 'academicSessions') !== null && !get('academicSessions').some(x => x.name === CONFIG.session)) insert('academicSessions', { id: uid('AS'), name: CONFIG.session, startDate: '', endDate: '', status: 'Active', semesters: (CONFIG.semesters || ['First','Second']).map(name => ({ name, startDate: '', endDate: '', registrationOpen: CONFIG.registrationOpen })), createdAt: new Date().toISOString() });
  // Session-specific planning examples: ordinary institutional records, not labelled as demo/test data.
  if (!get('academicSessions').some(x => x.name === '2027/2028')) insert('academicSessions', { id: 'AS-2027-2028', name: '2027/2028', startDate: '2027-09-01', endDate: '2028-07-31', status: 'Planned', semesters: [{ name: 'First', startDate: '2027-09-01', endDate: '2028-01-31', registrationOpen: false }, { name: 'Second', startDate: '2028-02-01', endDate: '2028-07-31', registrationOpen: false }], createdAt: new Date().toISOString() });
  // Legacy payments are assigned to the session that was current when this migration first runs.
  if (localStorage.getItem(P + 'payments') !== null) { const paymentRows = get('payments'); let changed = false; paymentRows.forEach(p => { if (!p.session) { p.session = CONFIG.session; changed = true; } }); if (changed) set('payments', paymentRows); }
  // Session-specific fee structures for the planned session. Do not overwrite administrator-edited records.
  const plannedFees = [
    { id: 'FE-2728-F1-ALL', facultyId: 'F1', level: null, session: '2027/2028', items: [{ name: 'Tuition', amount: 165000 }, { name: 'ICT and Digital Services', amount: 18000 }, { name: 'Examination', amount: 12000 }, { name: 'Library', amount: 5000 }] },
    { id: 'FE-2728-F1-200', facultyId: 'F1', level: 200, session: '2027/2028', items: [{ name: 'Tuition', amount: 165000 }, { name: 'ICT and Digital Services', amount: 18000 }, { name: 'Examination', amount: 12000 }, { name: 'Laboratory', amount: 10000 }, { name: 'Library', amount: 5000 }] },
    { id: 'FE-2728-F2-ALL', facultyId: 'F2', level: null, session: '2027/2028', items: [{ name: 'Tuition', amount: 135000 }, { name: 'ICT and Digital Services', amount: 18000 }, { name: 'Examination', amount: 12000 }, { name: 'Library', amount: 5000 }] },
  ];
  plannedFees.forEach(f => { if (!get('fees').some(x => x.session === f.session && x.facultyId === f.facultyId && Number(x.level || 0) === Number(f.level || 0))) insert('fees', f); });
  if (localStorage.getItem(P + 'chartOfAccounts') === null) set('chartOfAccounts', seedData().chartOfAccounts);
  if (localStorage.getItem(P + 'curricula') === null) {
    const starter = [
      { id: 'CUR1', programmeId: 'PR1', courseId: 'C1', session: CONFIG.session, level: 100, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR2', programmeId: 'PR1', courseId: 'C2', session: CONFIG.session, level: 100, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR3', programmeId: 'PR1', courseId: 'C3', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR4', programmeId: 'PR1', courseId: 'C4', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR5', programmeId: 'PR1', courseId: 'C5', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR6', programmeId: 'PR1', courseId: 'C6', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Elective', status: 'Proposed' },
      { id: 'CUR7', programmeId: 'PR2', courseId: 'C7', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR8', programmeId: 'PR3', courseId: 'C8', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
      { id: 'CUR9', programmeId: 'PR4', courseId: 'C9', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Proposed' },
    ];
    set('curricula', starter.filter(x => find('courses', x.courseId) && find('programmes', x.programmeId)));
  }
  // Ensure the current session has a usable curriculum example even when an earlier seed created an empty table.
  const currentCurriculum = [
    { id: 'CUR1', programmeId: 'PR1', courseId: 'C1', session: CONFIG.session, level: 100, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR2', programmeId: 'PR1', courseId: 'C2', session: CONFIG.session, level: 100, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR3', programmeId: 'PR1', courseId: 'C3', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR4', programmeId: 'PR1', courseId: 'C4', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR5', programmeId: 'PR1', courseId: 'C5', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR6', programmeId: 'PR1', courseId: 'C6', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Elective', status: 'Approved' },
    { id: 'CUR7', programmeId: 'PR2', courseId: 'C7', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR8', programmeId: 'PR3', courseId: 'C8', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR9', programmeId: 'PR4', courseId: 'C9', session: CONFIG.session, level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
  ];
  currentCurriculum.forEach(row => { if (find('courses', row.courseId) && find('programmes', row.programmeId) && !get('curricula').some(x => x.programmeId === row.programmeId && x.courseId === row.courseId && x.session === row.session && Number(x.level) === row.level && x.semester === row.semester)) insert('curricula', row); });
  // Planned curriculum for the next session is kept separate from the current session's mappings.
  const nextCurriculum = [
    { id: 'CUR-2728-PR1-C1', programmeId: 'PR1', courseId: 'C1', session: '2027/2028', level: 100, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR1-C2', programmeId: 'PR1', courseId: 'C2', session: '2027/2028', level: 100, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR1-C3', programmeId: 'PR1', courseId: 'C3', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR1-C4', programmeId: 'PR1', courseId: 'C4', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR1-C5', programmeId: 'PR1', courseId: 'C5', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR1-C6', programmeId: 'PR1', courseId: 'C6', session: '2027/2028', level: 200, semester: 'First', requirement: 'Elective', status: 'Approved' },
    { id: 'CUR-2728-PR2-C7', programmeId: 'PR2', courseId: 'C7', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR3-C8', programmeId: 'PR3', courseId: 'C8', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
    { id: 'CUR-2728-PR4-C9', programmeId: 'PR4', courseId: 'C9', session: '2027/2028', level: 200, semester: 'First', requirement: 'Core', status: 'Approved' },
  ];
  nextCurriculum.forEach(row => { if (find('courses', row.courseId) && find('programmes', row.programmeId) && !get('curricula').some(x => x.programmeId === row.programmeId && x.courseId === row.courseId && x.session === row.session && Number(x.level) === row.level && x.semester === row.semester)) insert('curricula', row); });

  /* The portal has ONE sign-in: the administrator. This keeps that account present and usable even if the
     browser holds older saved data (for example from an earlier version) with a different admin record. */
  const ADMIN = { id: 'S1', name: 'Dr. Ada Okonkwo', role: 'Admin', departmentId: null, email: 'admin@pci.edu', password: 'PciPortal26!', status: 'Active' };
  function ensureAdmin() {
    const staff = get('staff'), i = staff.findIndex((x) => x.id === ADMIN.id);
    if (i < 0) { set('staff', [...staff, ADMIN]); return; }
    const cur = staff[i];
    if (cur.role !== ADMIN.role || cur.email !== ADMIN.email || cur.password !== ADMIN.password || cur.status !== ADMIN.status) {
      staff[i] = { ...cur, role: ADMIN.role, email: ADMIN.email, password: ADMIN.password, status: ADMIN.status };
      set('staff', staff);
    }
  }
  ensureAdmin();
  syncRegistrations();

  return { CONFIG, saveConfig, get, set, find, insert, update, remove, uid, reset, gradeFor, cgpa, courseResultFor, saveCourseResult, submitCourseResults, approveCourseResults, approvedResults, semesterGPA, cumulativeGPA, issueTranscript, finance, seatsTaken, registeredUnits, passed, canRegister, nextMatNo, log, transaction, saveRegistration, syncRegistrations, getRegistration, getStudentRegistrationCourses, createAcademicSession, updateAcademicSession, activateAcademicSession, recordPayment, voidPayment, addFilterTestData };
})();
