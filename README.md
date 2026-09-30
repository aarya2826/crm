# Institute CRM

Web CRM for training institutes: leads, enrollments, fees, attendance, tasks, and reports.

## Tech stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript**
- **Prisma 6** + **PostgreSQL**
- **Tailwind CSS**
- **NextAuth v4** (credentials, JWT)
- **React Hook Form** + **Zod**
- **Recharts**, **ExcelJS**, **jsPDF**
- **bcryptjs**, **Sonner** toasts

## Features

### Leads
List, search, filter, score bands, assign counselor, convert to student, activity timeline, bulk status/assign/delete.

### Students
Enrollment into course + batch, status, documents, detail page with fees summary and tasks.

### Fees
Pending/partial/paid (computed), record payment, history, client-side receipt/invoice PDF, reminder stub.

### Courses & batches
Admin catalog. Course create/update also stores a fee structure (amount + installments).

### Attendance
Teachers/admins mark PRESENT / ABSENT / LATE per batch and date.

### Tasks
Assign follow-ups to staff, complete them, due-today badge.

### Reports
Tabs (Overview, Leads, Students, Revenue, Staff), date range, Excel export, chart PNG download.

### Settings
Institute profile, users, message templates. Messaging is logged only (no real SMS/email API).

## Folder structure

```
crm/
├── prisma/                 # Schema, migrations, seed
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/uploads/         # Student files (ignored except .gitkeep)
├── screenshots/            # Optional README images (add locally)
├── src/app/                # Routes, server actions, loading UI
│   ├── api/auth/           # NextAuth route
│   ├── dashboard/          # Home KPI queries
│   ├── leads/ students/ fees/ …
│   └── layout.tsx
├── src/components/         # Feature UI + layout + common controls
├── src/constants/          # Roles, statuses, labels
├── src/hooks/              # URL filters, debounce, sort, presence
├── src/lib/                # Auth, Prisma, Zod schemas, PDF/Excel helpers
├── src/middleware.ts       # Login + role gate
└── .env.example            # Required environment variables
```

Mutations are **server actions** in `src/app/*/actions.ts`, not REST CRUD APIs.

## Setup

```bash
git clone <your-repo-url>
cd crm
npm install
```

Copy env (Windows PowerShell):

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Set `NEXTAUTH_SECRET` to a long random string. Set `DATABASE_URL` to your Postgres database, for example:

`postgresql://postgres:YOUR_PASSWORD@localhost:5432/crm`

Create the empty database first (`CREATE DATABASE crm;`). Then:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`prisma migrate dev` is fine in development if you are iterating on the schema.

Do not commit `.env`. Older SQLite files (`prisma/dev.db`) are unused after this switch. Historical SQLite migrations are kept under `prisma/migrations_sqlite/` for reference only — Prisma applies `prisma/migrations/` (Postgres).

## Demo logins

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@institute.com` | `Admin@123` |
| Counselor | `counselor@institute.com` | `Staff@123` |
| Accountant | `accountant@institute.com` | `Staff@123` |
| Teacher | `teacher@institute.com` | `Staff@123` |

Change these after first login in a real deployment.

## Routes

| Path | Description | Typical roles |
|------|-------------|---------------|
| `/login` | Sign in | Public |
| `/` | Dashboard | All signed-in roles |
| `/leads` | Lead list | Admin, counselor |
| `/leads/[id]` | Lead profile | Admin, counselor |
| `/students` | Student list | Admin, counselor, accountant, teacher |
| `/students/[id]` | Student profile | Same as students |
| `/fees` | Collections | Admin, accountant |
| `/tasks` | My tasks | All signed-in roles |
| `/attendance` | Mark register | Admin, teacher |
| `/courses` | Course catalog | Admin |
| `/batches` | Batches | Admin |
| `/reports` | Analytics | Admin, counselor, accountant |
| `/settings` | Institute, users, templates | Admin |
| `/unauthorized` | Role denied | Signed-in |
| `/api/auth/[...nextauth]` | NextAuth | — |

## Screenshots

![Dashboard](./screenshots/dashboard.png)
![Leads](./screenshots/leads.png)
![Students](./screenshots/students.png)
![Fees](./screenshots/fees.png)
![Reports](./screenshots/reports.png)

## Known limitations

- SMS / email / WhatsApp sending is a **console stub** (`src/lib/messaging.ts`).
- Batch **seat capacity** is not stored; reports show fill relative to the largest batch.
- Receipts and invoices are generated **in the browser** (jsPDF), not stored as files.
- Lead score is a heuristic, not a trained model.
- Revenue forecast uses invoice `nextDueDate` and remaining course fee (approximate).
- You need a running **PostgreSQL** server; GitHub does not host the live database.

## License

MIT
