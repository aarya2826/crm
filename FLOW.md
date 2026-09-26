# Page flows

How screens connect. Writes go through **server actions**, not REST endpoints (except NextAuth).

## Login and role access

1. User opens `/login`. If already signed in, they are sent to `/`.
2. `LoginForm` calls NextAuth `signIn("credentials")` → `GET/POST /api/auth/[...nextauth]`.
3. Passwords are checked with bcrypt in `src/lib/auth.ts`. Inactive users cannot sign in.
4. JWT session is set. `src/middleware.ts` requires a token on every page except `/login` and `/api/auth`.
5. `canAccessPath` in `src/constants/roles.ts` maps URL prefixes to roles. Wrong role → `/unauthorized`.
6. After login everyone lands on `/` (dashboard). There is no separate home URL per role; the sidebar only shows allowed items.

## Lead creation → conversion → student

1. `/leads` loads `getLeadsPage` (filters, sort, pagination).
2. **Add New Lead** opens a modal. Submit calls `createLead` (`src/app/leads/actions.ts`). A `Lead` row is created (default status NEW).
3. Clicking a row goes to `/leads/[id]` (`getLeadById`) with profile, tasks, and activity.
4. **Convert** opens `ConvertLeadModal`. Submit calls `convertLeadToStudent` (`src/app/students/actions.ts`):
   - Creates a `Student` with `leadId`
   - Sets the lead status to `CONVERTED`
5. The lead stays in the list as converted (delete is blocked while the student still links to it). Open the student from `/students` or `/students/[id]`.

Dashboard **New Lead** uses `/leads?new=1`, which opens the same create modal.

## Fee structure → payment → receipt / invoice

1. Admin creates or edits a course on `/courses` (`createCourse` / `updateCourse`). That upserts a `FeeStructure` (total amount + installment count). If none exists, fees fall back to `Course.totalFee`.
2. `/fees` loads `getStudentFeePage`. Paid vs pending is **computed** from payments vs that total (not a stored status enum on the student).
3. **Record payment** (admin/accountant) calls `recordPayment`: creates `Payment` and a linked `Invoice` (sequential `nextInvoiceNumber` on institute settings).
4. **History** loads `getStudentPayments`. Download uses client helpers `downloadReceipt` / `downloadInvoice` (jsPDF) with institute name/logo. Nothing is uploaded to a storage bucket.
5. **Remind** calls `sendFeeReminder`, which logs activity via the messaging stub.

## Task creation → completion

1. `/tasks` lists `getMyTasks` grouped by due date.
2. **New task** calls `createTask` (optional related lead/student).
3. Completing a task calls `completeTask` (`status = DONE`). The UI may show a small celebration.
4. Tasks also appear on `/leads/[id]` and `/students/[id]`. Due-today count feeds the nav badge and notifications.

## Attendance marking

1. `/attendance` is limited to admin and teacher.
2. Pick a batch and date → `getAttendanceSheet` (students in that batch + existing marks).
3. Save → `saveAttendance` upserts `Attendance` on unique `(studentId, date)`.
4. Student detail can show a summary from `getStudentAttendanceView`.

## Reports → Excel / chart image

1. `/reports` loads `getAnalyticsData` for the current month range (local dates).
2. Tabs: Overview, Leads, Students, Revenue, Staff Performance. The From/To fields apply to all tabs via **Apply range**.
3. **Export Excel** uses `exportRowsToExcel` with the active tab’s rows.
4. Chart cards call html2canvas and download a PNG. This is client-side, not a server file.

## Documents (student)

1. On `/students/[id]`, upload goes to `uploadStudentDocument` (writes under `public/uploads`).
2. Delete calls `deleteStudentDocument` (DB row + file when possible).
