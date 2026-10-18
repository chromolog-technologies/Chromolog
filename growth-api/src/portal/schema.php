<?php

declare(strict_types=1);

/**
 * Company portal tables (CRM, sales, accounting, projects, people).
 * Money is stored as REAL rounded to 2 decimals in the company currency (settings.currency).
 * Runs on every connection; every statement is idempotent.
 */
function portal_migrate(PDO $pdo): void
{
    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK (role IN ('admin','marketing','accounts','project','employee')),
            phone         TEXT,
            hourly_rate   REAL NOT NULL DEFAULT 0,
            active        INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS api_tokens (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash   TEXT NOT NULL UNIQUE,
            label        TEXT,
            created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at   TEXT NOT NULL,
            last_used_at TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS audit_log (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER,
            action     TEXT NOT NULL,
            entity     TEXT NOT NULL,
            entity_id  INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lead_notes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
            user_id    INTEGER REFERENCES users(id),
            type       TEXT NOT NULL DEFAULT 'note',
            body       TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS clients (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            company    TEXT,
            email      TEXT,
            phone      TEXT,
            address    TEXT,
            tax_id     TEXT,
            notes      TEXT,
            lead_id    INTEGER REFERENCES leads(id),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contracts (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id             INTEGER NOT NULL REFERENCES clients(id),
            title                 TEXT NOT NULL,
            type                  TEXT NOT NULL DEFAULT 'project',
            start_date            TEXT,
            end_date              TEXT,
            value                 REAL NOT NULL DEFAULT 0,
            status                TEXT NOT NULL DEFAULT 'active',
            renewal_reminder_days INTEGER NOT NULL DEFAULT 30,
            file_path             TEXT,
            file_name             TEXT,
            notes                 TEXT,
            created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quotations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            number      TEXT NOT NULL UNIQUE,
            client_id   INTEGER REFERENCES clients(id),
            lead_id     INTEGER REFERENCES leads(id),
            title       TEXT,
            issue_date  TEXT NOT NULL,
            valid_until TEXT,
            status      TEXT NOT NULL DEFAULT 'draft',
            discount    REAL NOT NULL DEFAULT 0,
            tax_rate    REAL NOT NULL DEFAULT 0,
            subtotal    REAL NOT NULL DEFAULT 0,
            total       REAL NOT NULL DEFAULT 0,
            notes       TEXT,
            terms       TEXT,
            created_by  INTEGER REFERENCES users(id),
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS quotation_items (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
            description  TEXT NOT NULL,
            quantity     REAL NOT NULL DEFAULT 1,
            unit_price   REAL NOT NULL DEFAULT 0,
            amount       REAL NOT NULL DEFAULT 0,
            position     INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS invoices (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            number       TEXT NOT NULL UNIQUE,
            client_id    INTEGER NOT NULL REFERENCES clients(id),
            quotation_id INTEGER REFERENCES quotations(id),
            project_id   INTEGER REFERENCES projects(id),
            issue_date   TEXT NOT NULL,
            due_date     TEXT,
            status       TEXT NOT NULL DEFAULT 'draft',
            discount     REAL NOT NULL DEFAULT 0,
            tax_rate     REAL NOT NULL DEFAULT 0,
            subtotal     REAL NOT NULL DEFAULT 0,
            total        REAL NOT NULL DEFAULT 0,
            amount_paid  REAL NOT NULL DEFAULT 0,
            notes        TEXT,
            terms        TEXT,
            created_by   INTEGER REFERENCES users(id),
            created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS invoice_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            quantity    REAL NOT NULL DEFAULT 1,
            unit_price  REAL NOT NULL DEFAULT 0,
            amount      REAL NOT NULL DEFAULT 0,
            position    INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS payments (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            amount     REAL NOT NULL,
            date       TEXT NOT NULL,
            method     TEXT,
            reference  TEXT,
            notes      TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            date           TEXT NOT NULL,
            category       TEXT NOT NULL,
            vendor         TEXT,
            description    TEXT,
            amount         REAL NOT NULL,
            payment_method TEXT,
            reference      TEXT,
            project_id     INTEGER REFERENCES projects(id),
            payout_id      INTEGER,
            file_path      TEXT,
            file_name      TEXT,
            created_by     INTEGER REFERENCES users(id),
            created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS other_income (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            date           TEXT NOT NULL,
            category       TEXT NOT NULL,
            source         TEXT,
            description    TEXT,
            amount         REAL NOT NULL,
            payment_method TEXT,
            reference      TEXT,
            file_path      TEXT,
            file_name      TEXT,
            created_by     INTEGER REFERENCES users(id),
            created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            client_id   INTEGER REFERENCES clients(id),
            description TEXT,
            status      TEXT NOT NULL DEFAULT 'active',
            start_date  TEXT,
            deadline    TEXT,
            budget      REAL NOT NULL DEFAULT 0,
            created_by  INTEGER REFERENCES users(id),
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS project_members (
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id    INTEGER NOT NULL REFERENCES users(id),
            rate       REAL,
            PRIMARY KEY (project_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title           TEXT NOT NULL,
            description     TEXT,
            assignee_id     INTEGER REFERENCES users(id),
            status          TEXT NOT NULL DEFAULT 'todo',
            priority        TEXT NOT NULL DEFAULT 'medium',
            due_date        TEXT,
            estimated_hours REAL,
            fixed_amount    REAL NOT NULL DEFAULT 0,
            payout_id       INTEGER,
            created_by      INTEGER REFERENCES users(id),
            created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            completed_at    TEXT
        );
        CREATE TABLE IF NOT EXISTS timesheets (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            project_id  INTEGER NOT NULL REFERENCES projects(id),
            task_id     INTEGER REFERENCES tasks(id),
            date        TEXT NOT NULL,
            hours       REAL NOT NULL,
            description TEXT,
            status      TEXT NOT NULL DEFAULT 'pending',
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TEXT,
            payout_id   INTEGER,
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS daily_reports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL REFERENCES users(id),
            date            TEXT NOT NULL,
            summary         TEXT NOT NULL,
            tasks_completed TEXT,
            blockers        TEXT,
            plan_tomorrow   TEXT,
            hours           REAL,
            created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, date)
        );
        CREATE TABLE IF NOT EXISTS payouts (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL REFERENCES users(id),
            period_start   TEXT NOT NULL,
            period_end     TEXT NOT NULL,
            hours          REAL NOT NULL DEFAULT 0,
            hours_amount   REAL NOT NULL DEFAULT 0,
            task_amount    REAL NOT NULL DEFAULT 0,
            adjustments    REAL NOT NULL DEFAULT 0,
            total          REAL NOT NULL DEFAULT 0,
            status         TEXT NOT NULL DEFAULT 'pending',
            paid_date      TEXT,
            payment_method TEXT,
            reference      TEXT,
            expense_id     INTEGER,
            notes          TEXT,
            created_by     INTEGER REFERENCES users(id),
            created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recurring_invoices (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id   INTEGER NOT NULL REFERENCES clients(id),
            contract_id INTEGER REFERENCES contracts(id),
            title       TEXT NOT NULL,
            frequency   TEXT NOT NULL DEFAULT 'monthly',
            next_date   TEXT NOT NULL,
            end_date    TEXT,
            auto_send   INTEGER NOT NULL DEFAULT 0,
            active      INTEGER NOT NULL DEFAULT 1,
            discount    REAL NOT NULL DEFAULT 0,
            tax_rate    REAL NOT NULL DEFAULT 0,
            notes       TEXT,
            last_invoice_id INTEGER,
            created_by  INTEGER REFERENCES users(id),
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS recurring_items (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            recurring_id INTEGER NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
            description  TEXT NOT NULL,
            quantity     REAL NOT NULL DEFAULT 1,
            unit_price   REAL NOT NULL DEFAULT 0,
            amount       REAL NOT NULL DEFAULT 0,
            position     INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            number            TEXT NOT NULL UNIQUE,
            client_id         INTEGER REFERENCES clients(id),
            contract_id       INTEGER REFERENCES contracts(id),
            project_id        INTEGER REFERENCES projects(id),
            subject           TEXT NOT NULL,
            description       TEXT,
            channel           TEXT NOT NULL DEFAULT 'phone',
            priority          TEXT NOT NULL DEFAULT 'medium',
            status            TEXT NOT NULL DEFAULT 'open',
            assignee_id       INTEGER REFERENCES users(id),
            response_due_at   TEXT NOT NULL,
            resolve_due_at    TEXT NOT NULL,
            first_response_at TEXT,
            resolved_at       TEXT,
            created_by        INTEGER REFERENCES users(id),
            created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ticket_comments (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            user_id    INTEGER REFERENCES users(id),
            body       TEXT NOT NULL,
            internal   INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS job_runs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            job         TEXT NOT NULL,
            run_date    TEXT NOT NULL,
            status      TEXT NOT NULL,
            detail      TEXT,
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
        CREATE INDEX IF NOT EXISTS idx_job_runs ON job_runs(job, run_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
        CREATE INDEX IF NOT EXISTS idx_timesheets_user ON timesheets(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_reports_date ON daily_reports(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
    SQL);

    $recCols = array_column($pdo->query('PRAGMA table_info(recurring_invoices)')->fetchAll(), 'name');
    if (!in_array('anchor_day', $recCols, true)) {
        // Day of month the schedule bills on, so 31 Aug → 30 Sep → 31 Oct (no drift).
        $pdo->exec('ALTER TABLE recurring_invoices ADD COLUMN anchor_day INTEGER');
    }
    $invCols = array_column($pdo->query('PRAGMA table_info(invoices)')->fetchAll(), 'name');
    if (!in_array('recurring_id', $invCols, true)) {
        $pdo->exec('ALTER TABLE invoices ADD COLUMN recurring_id INTEGER');
    }

    // CRM fields on the existing website leads table.
    $cols = array_column($pdo->query('PRAGMA table_info(leads)')->fetchAll(), 'name');
    foreach ([
        'assigned_to' => 'INTEGER',
        'next_follow_up' => 'TEXT',
        'estimated_value' => 'REAL',
        'client_id' => 'INTEGER',
    ] as $col => $type) {
        if (!in_array($col, $cols, true)) {
            $pdo->exec("ALTER TABLE leads ADD COLUMN {$col} {$type}");
        }
    }
}
