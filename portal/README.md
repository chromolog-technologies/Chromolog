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
| Accounts | Invoices, credit/debit notes & payments, quotations → invoices, expenses & bills, other income, payouts, profit & loss, sales & GST reports, ledger CSV |
| Project team | All projects, tasks & assignments, timesheet approvals, daily reports (incl. who hasn't submitted) |
| Employee | Own tasks, timesheet, daily report, earnings; projects they're a member of |

Everyone can log time, submit a daily report and see their own earnings.

**Invoices** follow Indian GST rules once GST is switched on in Company settings: CGST + SGST for the
company's own state, IGST for other states and exports, exempt / non-GST supplies, per-line GST rates,
HSN/SAC codes, place of supply and reverse charge.
- Drafts can be edited or deleted. **Issuing** gives the next number (e.g. `INV/26-27/0001`, restarting each
  financial year), fixes the company and customer details on the invoice, and stores a PDF copy.
- After issuing, an invoice is never deleted. Changes need an admin and a reason; cancelling needs a reason.
  Use credit/debit notes for corrections. Every event (old/new values, who, when, why) is in the invoice's
  **History**, which the database itself refuses to change or delete.
- Changing company details in settings only affects new invoices unless the admin applies them to all
  invoices or to a date range.
- PDF download/print, email with the PDF attached, WhatsApp share, duplicate, CSV/Excel export, and a
  **Service list** (admin-maintained rates, HSN/SAC and GST) that fills invoice lines.

**Freelancer pay** = approved timesheet hours × rate (the project rate if set, otherwise the
person's default hourly rate) + fixed amounts on tasks they completed. Accounts creates a payout
for a period; marking it paid records a "Freelancer Payouts" expense automatically.

## Daily automation

Once a day the server runs three jobs (`growth-api/cron.php`, or **Admin → Automation & backups → Run today's jobs**):

1. **Recurring invoices** — creates each due invoice from its schedule (monthly, quarterly, half-yearly,
   yearly) on the same day of the month, as a draft or issued straight away. Missed periods are caught up.
2. **Backup** — a zip with a consistent copy of the database and every uploaded bill/contract, kept in
   `chromolog-private/backups` (newest 14). Admins can download them from the portal.
3. **Daily digest** — one email per person with only what applies to them: lead follow-ups (marketing),
   overdue invoices, new recurring invoices, contract renewals, payouts to pay (accounts), missing daily
   reports, approvals, overdue tasks, tickets past target (project team), and each person's own overdue
   tasks, open tickets and missed report. Nobody gets an email when there's nothing to report.
   Switch it off or choose report days in **Company settings**.

**Support tickets** — log client issues (phone, WhatsApp, email…), assign them, and track the first-response
and resolution targets per priority (set in Company settings). Internal notes don't count as a response.
The assignee gets an email when a ticket is assigned to them.

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
   Optional: `'backup_path'` (default `chromolog-private/backups`) and `'backup_keep'` (default 14).
   The portal admin password is the existing `admin_password_hash`.
2. Push to `main`: GitHub Actions builds the portal and uploads it to `public_html/portal`.
3. Sign in at https://chromologtechnologies.com/portal/, fill **Company settings** (address, bank
   details for invoices), then create users for each team.
4. The old panel (`/api/ai/admin.php`) now redirects to the portal's Leads page.
5. **Cron job** (hPanel → Advanced → Cron Jobs → Custom): run once a day, e.g. 02:30 UTC (08:00 India):
   ```
   /usr/bin/php /home/u818464796/domains/chromologtechnologies.com/public_html/api/ai/cron.php
   ```
   Check **Automation & backups** the next morning to confirm it ran.

## Back-ups

Everything is in the SQLite file (`db_path`) plus the `uploads` folder. The daily job zips both into
`backups/` (newest 14 kept). Download one from **Automation & backups** every week or two and keep it
off the server (e.g. Google Drive). Use **Profit & loss → Ledger CSV** for your accountant.
