# PCI Admin Portal — Refinement V14

## Session-specific curriculum and fee structures

V12 builds on V11 with a unified **Session curriculum & fees** workspace and session-specific assessment logic.

### Session planning workspace
- New Academic Management → Session curriculum & fees page.
- Select an academic session and review its curriculum mappings, fee structures, student fee assessment totals, and readiness checks.
- Jump directly to Curriculum Mapping or Finance to edit the selected type of record.
- Session summaries show whether curriculum mappings, fee structures, session dates, and semester windows have been configured.

### Curriculum
- Curriculum mappings remain tied to programme, course, academic session, level, semester, requirement, and approval status.
- Current and planned sessions have separate mappings.
- Curriculum forms now use configured academic sessions and configured semester names rather than hard-coded First/Second values.
- Seeded course mappings are normal institutional sample records without demo/test labels.

### Fees and payments
- Fee structures are scoped to an academic session and faculty, with optional level-specific structures.
- A level-specific fee structure takes priority over the faculty-wide structure for that session.
- Finance calculations can assess a student for a specified academic session.
- Payments are tagged to the session active when recorded. Legacy payments without a session are assigned to the current session on migration, so payments from one session are not counted against another session's assessment.
- The Finance fee-structure list now makes it clear that records across sessions are displayed.

### Included ordinary example data
- The current session `2026/2027` has curriculum mappings and existing faculty fee structures.
- A planned `2027/2028` session includes dates, semester windows, curriculum mappings for the available programmes, and faculty-wide plus level-specific fee structures.
- These records use normal names and codes, without `[DEMO]` or `[TEST]` labels, so the screens resemble a real administrative workspace.
- The future session remains Planned; it does not replace the current session or change current student assessments.

#
## V13 — Lecturer management

- Adds **People & Staff → Lecturer management** as a dedicated page.
- Administrators can manually add lecturer profiles with full name, unique staff ID, institutional email, department, qualification, specialization, employment type, status, and a temporary password for the prototype account.
- Administrators can edit lecturer details and activate/deactivate records without deleting historical records or course links.
- Lecturer records are saved in the existing `staff` table, so the lecturer allocation workspace and course catalogue read the same records.
- Only active eligible lecturers are offered for new allocations, with the existing department validation retained.
- Includes search, department and status filters, plus summary counts for lecturer records, active lecturers, and allocated lecturers.
- Duplicate staff IDs/emails and emails already used by students are rejected; create/edit/status changes are written to the audit log.

### Prototype limitation reminder

Lecturer accounts and all portal data still use browser `localStorage`. This version is for development and demonstration, not production use with real staff credentials. A production deployment needs server-side authentication, secure password hashing, role permissions, and a shared database.


## V14 — Results management and transcripts

- Replaces the old one-score result form with a session- and semester-aware Results Management workflow.
- Results are entered against a course and its registered students; the lecturer/admin does not need to retype the roster.
- Assessment split is configured as CA out of 30 plus examination out of 70. The total is calculated from the two components and the existing five-point A–F grade scale is applied.
- Input validation rejects missing scores, CA outside 0–30, exam scores outside 0–70, and unregistered student/course combinations.
- Results move through Draft → Submitted → Approved. A course cannot be submitted while any registered student is missing a complete draft result. Submitted and approved results cannot be edited directly.
- The HOD / Results Officer approval step is represented in the workflow. For this local prototype, the administrator account can act as the approver; production must enforce named HOD/Results Officer accounts and server-side role permissions.
- GPA and CGPA are credit-weighted and calculated from approved results only. Transcript rows are generated from those approved result records and include session, semester, course, credit units, CA, exam, total, grade, grade point, semester GPA and CGPA.
- Draft and submitted results never appear on an official transcript. Legacy `students.results` scores are preserved but are not silently migrated to approved results because their CA/exam split, academic period and approval status cannot be verified. They must be reviewed and entered/approved through the new workflow before appearing on a transcript.
- Adds `courseResults` to local backup/CSV tools. Older backups without this new table remain restorable; the new table starts empty when restoring an older backup.

### V14 grading assumption

The sample five-point scale is A=70–100 (5), B=60–69 (4), C=50–59 (3), D=45–49 (2), E=40–44 (1), F=0–39 (0). Confirm this scale and any repeat-course, incomplete, withdrawal, rounding and final-standing rules with the institution before using real results.

## Prototype limitations
- Data remains in browser localStorage and does not sync across browsers/computers.
- Fee assessment is session-aware, but a production system should also introduce immutable fee assessment snapshots per student/session and server-side transactional accounting before use with real university finances.
- The current global course catalogue is still shared; curriculum mappings decide which courses belong to each programme/session/level/semester.

## Validation
- `node --check js/db.js` passed.
- `node --check js/admin.js` passed.
- `node tests/integrity.test.js`: 55 passed, 0 failed.
- ZIP integrity verified.
- JavaScript syntax checks passed for `js/db.js` and `js/admin.js`.
- Integrity tests: 55 passed, 0 failed, including score bounds, registration checks, submission/approval gates, GPA and transcript issuance.
- ZIP integrity verified. The new screen still needs live-browser visual/interaction testing.


## V15 — Student census & physical verification

- Adds **Student services → Student census & statistics** with live counts and filters for faculty, department, level, status, entry/admission session and text search.
- Provides level and faculty breakdowns and CSV export of the filtered student register.
- Adds **Student services → Physical student verification** to create session-based verification exercises with optional department and level scope.
- Each exercise creates a snapshot roster and supports Pending, Verified, Absent and Flagged outcomes, optional notes, staff attribution, timestamps and CSV report export.
- A Flagged record requires a note. Physical verification does not automatically deactivate or change a student's official enrolment status.
- Adds verification records to local backup and table export/import; older backups without these optional tables remain restorable.
- Resetting sample data also clears local verification exercises and records.
- This remains a browser-local prototype. Use secure server-side storage, role enforcement and approved identity-verification procedures before collecting real student verification data.
