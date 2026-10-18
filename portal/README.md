# Chromolog Company Portal

Internal portal for CRM, quotations & invoices, accounting, projects, timesheets, daily reports
and freelancer payouts. Lives at **https://chromologtechnologies.com/portal/** once deployed.

- **Frontend:** this folder (React + Vite + Tailwind), built into `portal/dist`.
- **Backend:** `growth-api/v1.php` + `growth-api/src/portal/` (PHP + SQLite), served at
  `/api/ai/v1/…`, sharing the database with the website's lead capture.

## Roles

| Role | Can use |
|---|---|
| Admin | Everything, plus Users & roles and Company settings. Creates projects. |
| Marketing | Leads (pipeline, notes, follow-ups, convert to client), clients, contracts, quotations |
| Accounts | Invoices & payments, quotations → invoices, expenses & bills, other income, payouts, profit & loss, ledger CSV |
| Project team | All projects, tasks & assignments, timesheet approvals, daily reports (incl. who hasn't submitted) |
| Employee | Own tasks, timesheet, daily report, earnings; projects they're a member of |

Everyone can log time, submit a daily report and see their own earnings.

**Freelancer pay** = approved timesheet hours × rate (the project rate if set, otherwise the
person's default hourly rate) + fixed amounts on tasks they completed. Accounts creates a payout
for a period; marking it paid records a "Freelancer Payouts" expense automatically.

## Run locally

```bash
# 1. One-time: a private config for local testing (outside the repo)
mkdir -p ~/chromolog-dev
cp growth-api/config.example.php ~/chromolog-dev/config.php
# edit ~/chromolog-dev/config.php: set admin_email, admin_password_hash, ip_salt, allowed_origins => ['http://localhost:5174']

# 2. API (terminal 1)
cd growth-api && composer install
CHROMOLOG_CONFIG=~/chromolog-dev/config.php php -S 127.0.0.1:8788 dev-router.php

# 3. Portal (terminal 2)
cd portal && npm install && npm run dev
```

Open http://localhost:5174/portal/ and sign in with `admin_email` and the password you hashed.
The first admin account is created automatically on first use.

## Daily report API (for other apps or scripts)

1. Sign in → **Profile → Personal API keys → Create key**.
2. Send:

```http
POST https://chromologtechnologies.com/api/ai/v1/reports
Authorization: Bearer <key>
Content-Type: application/json

{ "summary": "What I did today", "tasks_completed": "…", "blockers": "…", "plan_tomorrow": "…", "hours": 8, "date": "2026-10-19" }
```

`date` is optional (defaults to today, company timezone) and may be up to 7 days back; sending
again for the same date updates the report. `GET /api/ai/v1/reports?mine=1` lists your reports.
If a host strips the `Authorization` header, send `X-Auth-Token: <key>` instead.

## Going live (when you say "push")

1. Add to `chromolog-private/config.php` on Hostinger:
   ```php
   'admin_email' => 'info@chromologtechnologies.com', // your portal admin login
   'uploads_path' => __DIR__ . '/uploads',            // bills & contracts, outside public_html
   'timezone' => 'Asia/Kolkata',
   ```
   The portal admin password is the existing `admin_password_hash`.
2. Push to `main`: GitHub Actions builds the portal and uploads it to `public_html/portal`.
3. Sign in at https://chromologtechnologies.com/portal/, fill **Company settings** (address, bank
   details for invoices), then create users for each team.
4. The old panel (`/api/ai/admin.php`) now redirects to the portal's Leads page.

## Back-ups

Everything is in the SQLite file (`db_path`) plus the `uploads` folder. Download both from
Hostinger regularly (or ask for an automatic daily copy), and use **Profit & loss → Ledger CSV**
for your accountant.
