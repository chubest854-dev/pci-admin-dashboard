/* Run with:  node tests/integrity.test.js
   Loads js/db.js with a fake localStorage and checks that payments, the ledger and registrations stay in step. */
const fs = require('fs'), path = require('path');
let store = {}, failWrites = false;
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { if (failWrites && k === 'pci_journalEntries') throw new Error('QuotaExceededError (simulated)'); store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
global.window = {};
const load = () => { store = {}; return new Function('localStorage', 'window', fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8') + ';return DB;')(global.localStorage, global.window); };

let passed = 0, failed = 0;
const check = (name, cond) => { cond ? passed++ : failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name); };
const trial = (DB) => { // net balance per account from posted journal entries
  const t = {}; DB.get('journalEntries').filter((j) => j.status === 'Posted').forEach((j) => {
    t[j.debitAccountId] = (t[j.debitAccountId] || 0) + j.amount; t[j.creditAccountId] = (t[j.creditAccountId] || 0) - j.amount; });
  return t;
};

let DB = load();
// ---- registration: one source of truth ----
const rows = DB.get('registrations'), withCourses = DB.get('students').filter((s) => s.registeredCourses.length);
check('registrations table healed to match students on load', rows.length === withCourses.length && rows.every((r) => r.courseIds.length));
const st1 = DB.find('students', 'ST1');
let r = DB.saveRegistration('ST1', [...st1.registeredCourses, 'C4'], { id: 'ST1', name: st1.name });
check('student add writes both stores', r.ok && DB.find('students', 'ST1').registeredCourses.includes('C4') && DB.get('registrations').find((x) => x.studentId === 'ST1').courseIds.includes('C4'));
check('only one registration row per student and session', DB.get('registrations').filter((x) => x.studentId === 'ST1').length === 1);
check('full course (C6, capacity 2) rejected', !DB.saveRegistration('ST1', ['C3', 'C4', 'C6'], { id: 'ST1' }).ok);
check('course from another level/department rejected', !DB.saveRegistration('ST1', ['C3', 'C4', 'C8'], { id: 'ST1' }).ok);
check('unmet prerequisite rejected (C5 needs C3 passed)', !DB.saveRegistration('ST1', ['C3', 'C4', 'C5'], { id: 'ST1' }).ok);
check('unpaid student (blocked) cannot add courses', !DB.saveRegistration('ST3', ['C6', 'C4'], { id: 'ST3' }).ok);
check('blocked student CAN still drop', DB.saveRegistration('ST3', [], { id: 'ST3' }).ok && !DB.get('registrations').some((x) => x.studentId === 'ST3'));
DB.CONFIG.registrationOpen = false;
check('closed registration rejects changes', !DB.saveRegistration('ST1', ['C3'], { id: 'ST1' }).ok);
DB.CONFIG.registrationOpen = true;
check('dropping everything removes the registration row', DB.saveRegistration('ST1', [], { id: 'ST1' }).ok && !DB.get('registrations').some((x) => x.studentId === 'ST1'));
check('registration count equals students with courses', DB.get('registrations').length === DB.get('students').filter((s) => s.registeredCourses.length).length);

// ---- semester-aware registration: editing one semester must preserve the other ----
DB = load();
DB.insert('courses', { id: 'C10', code: 'CSC 202', title: 'Second Semester Programming', units: 3, level: 200, semester: 'Second', type: 'Core', departmentId: 'D1', lecturerId: 'T1', capacity: 50, prerequisiteId: null });
r = DB.saveRegistration('ST1', ['C10'], { id: 'S1', name: 'Admin', session: DB.CONFIG.session, semester: 'Second' });
check('second semester registration can be saved independently', r.ok && DB.find('students', 'ST1').registeredCourses.includes('C10'));
r = DB.saveRegistration('ST1', ['C4'], { id: 'S1', name: 'Admin', session: DB.CONFIG.session, semester: 'First' });
check('editing first semester preserves second semester courses', r.ok && DB.find('students', 'ST1').registeredCourses.includes('C10') && DB.find('students', 'ST1').registeredCourses.includes('C4'));
check('registration records are separated by semester', DB.get('registrations').filter(x => x.studentId === 'ST1' && x.session === DB.CONFIG.session).some(x => x.semester === 'First' && x.courseIds.includes('C4')) && DB.get('registrations').filter(x => x.studentId === 'ST1' && x.session === DB.CONFIG.session).some(x => x.semester === 'Second' && x.courseIds.includes('C10')));
const oldSessionCount = DB.get('registrations').filter(x => x.studentId === 'ST1' && x.session === DB.CONFIG.session).length;
const createdSession = DB.createAcademicSession('2028/2029');
check('new academic session can be created without overwriting current session', createdSession.ok && DB.CONFIG.session === '2026/2027' && DB.get('academicSessions').some(x => x.name === '2028/2029'));
check('duplicate academic session rejected', !DB.createAcademicSession('2028/2029').ok);
const activateResult = DB.activateAcademicSession(createdSession.session.id);
check('activating a new session changes current session but does not copy old registrations', activateResult.ok && DB.CONFIG.session === '2028/2029' && DB.get('registrations').filter(x => x.studentId === 'ST1' && x.session === '2028/2029').length === 0 && DB.find('students', 'ST1').registeredCourses.length === 0);
check('historical session registrations remain available after activation', DB.get('registrations').filter(x => x.studentId === 'ST1' && x.session === '2026/2027').length === oldSessionCount);

// ---- session-specific curriculum, fee structures and payment assessments ----
DB = load();
check('planned 2027/2028 session exists separately from the current session', DB.get('academicSessions').some(x => x.name === '2027/2028' && x.status === 'Planned') && DB.CONFIG.session === '2026/2027');
check('curriculum mappings are available for both current and planned sessions', DB.get('curricula').some(x => x.session === '2026/2027') && DB.get('curricula').some(x => x.session === '2027/2028'));
check('planned session has ordinary fee structures without test labels', DB.get('fees').some(x => x.session === '2027/2028' && x.facultyId === 'F1') && !DB.get('fees').filter(x => x.session === '2027/2028').some(x => /demo|test/i.test(JSON.stringify(x))));
const currentAssessment = DB.finance(DB.find('students','ST1'), '2026/2027');
const nextAssessment = DB.finance(DB.find('students','ST1'), '2027/2028');
check('fee assessment uses the selected session and level-specific fees take priority', currentAssessment.total === 175000 && nextAssessment.total === 210000);
check('payments from current session do not count against next session fees', currentAssessment.paid === 175000 && nextAssessment.paid === 0);

// ---- payments: record + post exactly once ----
DB = load();
const bal0 = DB.finance(DB.find('students', 'ST2')).balance, je0 = DB.get('journalEntries').length;
r = DB.recordPayment({ studentId: 'ST2', amount: 25000, method: 'Bank transfer', reference: 'TEST-001', by: { id: 'S2', name: 'Bursar' } });
check('payment recorded', r.ok);
check('payment is tagged to the current academic session', r.ok && r.payment.session === DB.CONFIG.session);
check('student balance reduced', DB.finance(DB.find('students', 'ST2')).balance === bal0 - 25000);
check('exactly one journal entry added', DB.get('journalEntries').length === je0 + 1);
check('journal entry linked to payment', DB.get('journalEntries').filter((j) => j.sourceId === r.payment.id).length === 1);
check('duplicate reference rejected', !DB.recordPayment({ studentId: 'ST2', amount: 1000, method: 'Cash', reference: 'test-001', by: { id: 'S2' } }).ok);
check('overpayment rejected', !DB.recordPayment({ studentId: 'ST2', amount: 99999999, method: 'Cash', reference: 'TEST-002', by: { id: 'S2' } }).ok);
check('decimal amount rejected', !DB.recordPayment({ studentId: 'ST2', amount: 10.5, method: 'Cash', reference: 'TEST-003', by: { id: 'S2' } }).ok);
check('ledger and student payments agree (cash)', Object.values(trial(DB)).some((v) => v === 25000) );

// ---- void: reverses ledger and restores balance ----
const pid = r.payment.id;
check('recorder cannot void own payment', !DB.voidPayment(pid, 'wrong student', { id: 'S2', role: 'bursar' }).ok);
check('reason required', !DB.voidPayment(pid, 'no', { id: 'S1', role: 'admin' }).ok);
r = DB.voidPayment(pid, 'Entered against wrong student', { id: 'S1', name: 'Admin', role: 'admin' });
check('admin can void', r.ok && DB.find('payments', pid).status === 'voided');
check('balance restored after void', DB.finance(DB.find('students', 'ST2')).balance === bal0);
check('voided payment not in confirmed history', !DB.finance(DB.find('students', 'ST2')).payments.some((p) => p.id === pid));
check('journal nets to zero for that payment', DB.get('journalEntries').filter((j) => j.paymentId === pid || j.sourceId === pid).reduce((n, j) => n + (j.sourceType === 'reversal' ? -j.amount : j.amount), 0) === 0);
check('voiding twice rejected', !DB.voidPayment(pid, 'again please', { id: 'S1', role: 'admin' }).ok);
check('voided reference stays reserved', !DB.recordPayment({ studentId: 'ST2', amount: 1000, method: 'Cash', reference: 'TEST-001', by: { id: 'S2' } }).ok);

// ---- rollback when storage fails mid-way ----
DB = load();
const pCount = DB.get('payments').length;
failWrites = true;
let threw = false; try { DB.recordPayment({ studentId: 'ST2', amount: 1000, method: 'Cash', reference: 'TEST-FAIL', by: { id: 'S2' } }); } catch (e) { threw = true; }
failWrites = false;
check('failed write throws', threw);
check('payment rolled back when journal write fails', DB.get('payments').length === pCount);

// ---- results workflow: CA + examination, approval gate, GPA and transcript ----
DB = load();
let resultRow = DB.saveCourseResult({ studentId: 'ST1', courseId: 'C3', session: DB.CONFIG.session, semester: 'First', ca: 24, exam: 56 }, { id: 'S1', name: 'Admin' });
check('valid CA and exam scores save as a draft with computed total and grade', resultRow.ok && resultRow.result.totalScore === 80 && resultRow.result.grade === 'A' && resultRow.result.gradePoint === 5 && resultRow.result.status === 'Draft');
check('missing CA or exam score is rejected', !DB.saveCourseResult({ studentId: 'ST1', courseId: 'C3', ca: '', exam: 50 }, { id: 'S1' }).ok);
check('CA above 30 is rejected', !DB.saveCourseResult({ studentId: 'ST1', courseId: 'C3', ca: 31, exam: 50 }, { id: 'S1' }).ok);
check('exam above 70 is rejected', !DB.saveCourseResult({ studentId: 'ST1', courseId: 'C3', ca: 20, exam: 71 }, { id: 'S1' }).ok);
check('unregistered student cannot receive a course result', !DB.saveCourseResult({ studentId: 'ST4', courseId: 'C3', ca: 20, exam: 50 }, { id: 'S1' }).ok);
check('transcript excludes draft results', DB.approvedResults('ST1').length === 0 && !DB.issueTranscript('ST1', { id: 'S1', name: 'Admin' }).ok);
let resultFlow = DB.submitCourseResults('C3', DB.CONFIG.session, 'First', { id: 'S1', name: 'Admin' });
check('draft result submits for review', resultFlow.ok && DB.courseResultFor('ST1', 'C3').status === 'Submitted');
check('submitted result cannot be edited directly', !DB.saveCourseResult({ studentId: 'ST1', courseId: 'C3', ca: 25, exam: 55 }, { id: 'S1' }).ok);
check('unauthorized role cannot approve results', !DB.approveCourseResults('C3', DB.CONFIG.session, 'First', { id: 'S1', name: 'Lecturer', role: 'lecturer' }).ok);
resultFlow = DB.approveCourseResults('C3', DB.CONFIG.session, 'First', { id: 'S1', name: 'Results Officer', role: 'Results Officer' });
check('results officer can approve submitted result', resultFlow.ok && DB.approvedResults('ST1').some(x => x.courseId === 'C3'));
check('approved result GPA is credit weighted and transcript can be issued', DB.cumulativeGPA('ST1') === 5 && DB.issueTranscript('ST1', { id: 'S1', name: 'Results Officer' }).ok);
check('issued transcript records count from approved results', DB.find('transcripts', DB.get('transcripts').find(x => x.studentId === 'ST1').id).resultCount === 1);

// ---- student census and physical verification data persistence ----
DB = load();
DB.insert('verificationExercises', { id: 'VE1', title: 'Sample census', session: DB.CONFIG.session, createdAt: new Date().toISOString() });
DB.insert('verificationRecords', { id: 'VR1', exerciseId: 'VE1', studentId: 'ST1', status: 'Pending' });
check('verification exercise records can be stored separately from student enrolment', DB.get('verificationExercises').length === 1 && DB.get('verificationRecords').length === 1);
DB.update('verificationRecords', 'VR1', { status: 'Verified', verifiedByName: 'Results Officer' });
check('physical verification status updates without changing student enrolment status', DB.find('verificationRecords', 'VR1').status === 'Verified' && DB.find('students', 'ST1').status === 'Active');
check('census population remains based on student records, not verification status', DB.get('students').length === 4 && DB.get('verificationRecords').length === 1);

// ---- credit balance is visible, not hidden ----
DB = load();
DB.insert('payments', { id: 'PX', studentId: 'ST1', amount: 50000, reference: 'X', status: 'confirmed' });
const f = DB.finance(DB.find('students', 'ST1'));
check('credit balance reported', f.credit === 50000 && f.balance === 0 && f.percent <= 100);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
