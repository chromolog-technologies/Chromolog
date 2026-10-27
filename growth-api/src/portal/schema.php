<?php

declare(strict_types=1);

/**
 * Database schema (MySQL / MariaDB). Money is DOUBLE rounded to 2 decimals in the company
 * currency (settings.currency); timestamps are DATETIME in UTC; business dates are DATE.
 *
 * The schema is created once and versioned in app_meta: bump SCHEMA_VERSION and add a step
 * to schema_upgrades() for later changes.
 */

const SCHEMA_VERSION = 2;

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

/** Every table, in a valid creation order. */
function schema_tables(): array
{
    $line = 'id INT AUTO_INCREMENT PRIMARY KEY';
    $now = 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP';
    $itemColumns = "
        description   TEXT NOT NULL,
        quantity      DOUBLE NOT NULL DEFAULT 1,
        unit_price    DOUBLE NOT NULL DEFAULT 0,
        amount        DOUBLE NOT NULL DEFAULT 0,
        position      INT NOT NULL DEFAULT 0,
        service_id    INT NULL,
        hsn_sac       VARCHAR(20) NULL,
        unit          VARCHAR(20) NULL,
        discount      DOUBLE NOT NULL DEFAULT 0,
        gst_rate      DOUBLE NOT NULL DEFAULT 0,
        taxable_value DOUBLE NULL,
        cgst          DOUBLE NOT NULL DEFAULT 0,
        sgst          DOUBLE NOT NULL DEFAULT 0,
        igst          DOUBLE NOT NULL DEFAULT 0,
        line_total    DOUBLE NULL";
    $taxColumns = "
        place_of_supply VARCHAR(2) NULL,
        supply_type     VARCHAR(10) NOT NULL DEFAULT 'non_gst',
        reverse_charge  TINYINT NOT NULL DEFAULT 0,
        taxable_value   DOUBLE NOT NULL DEFAULT 0,
        cgst            DOUBLE NOT NULL DEFAULT 0,
        sgst            DOUBLE NOT NULL DEFAULT 0,
        igst            DOUBLE NOT NULL DEFAULT 0,
        tax_total       DOUBLE NOT NULL DEFAULT 0";

    return [
        // Website chat and lead capture.
        'conversations' => "
            session_id VARCHAR(100) PRIMARY KEY,
            ip_hash    VARCHAR(100) NOT NULL,
            page       VARCHAR(255) NULL,
            turns      INT NOT NULL DEFAULT 0,
            created_at {$now},
            updated_at {$now}",
        'messages' => "
            {$line},
            session_id    VARCHAR(100) NOT NULL,
            role          VARCHAR(20) NOT NULL,
            text          MEDIUMTEXT NOT NULL,
            input_tokens  INT NULL,
            output_tokens INT NULL,
            created_at    {$now},
            INDEX idx_messages_session (session_id, id)",
        'requests' => "
            id         BIGINT AUTO_INCREMENT PRIMARY KEY,
            ip_hash    VARCHAR(100) NOT NULL,
            created_at {$now},
            INDEX idx_requests (ip_hash, created_at),
            INDEX idx_requests_time (created_at)",
        'leads' => "
            {$line},
            session_id       VARCHAR(100) NULL UNIQUE,
            source           VARCHAR(40) NOT NULL DEFAULT 'website_chat',
            full_name        VARCHAR(160) NULL,
            email            VARCHAR(190) NULL,
            phone            VARCHAR(40) NULL,
            company          VARCHAR(190) NULL,
            industry         VARCHAR(160) NULL,
            location         VARCHAR(255) NULL,
            service_interest TEXT NULL,
            budget_range     VARCHAR(120) NULL,
            timeline         VARCHAR(120) NULL,
            role             VARCHAR(120) NULL,
            summary          TEXT NULL,
            score            VARCHAR(20) NULL,
            status           VARCHAR(20) NOT NULL DEFAULT 'new',
            notes            TEXT NULL,
            created_at       {$now},
            updated_at       {$now},
            assigned_to      INT NULL,
            next_follow_up   DATE NULL,
            estimated_value  DOUBLE NULL,
            client_id        INT NULL,
            INDEX idx_leads_status (status)",

        // People, sign-in and settings.
        'users' => "
            {$line},
            name                 VARCHAR(120) NOT NULL,
            email                VARCHAR(190) NOT NULL UNIQUE,
            password_hash        VARCHAR(255) NOT NULL,
            role                 VARCHAR(20) NOT NULL,
            phone                VARCHAR(40) NULL,
            hourly_rate          DOUBLE NOT NULL DEFAULT 0,
            active               TINYINT NOT NULL DEFAULT 1,
            created_at           {$now},
            failed_logins        INT NOT NULL DEFAULT 0,
            locked_until         DATETIME NULL,
            last_login_at        DATETIME NULL,
            must_change_password TINYINT NOT NULL DEFAULT 0,
            password_changed_at  DATETIME NULL,
            activated_at         DATETIME NULL,
            CONSTRAINT chk_users_role CHECK (role IN ('admin','marketing','accounts','project','employee'))",
        'api_tokens' => "
            {$line},
            user_id      INT NOT NULL,
            token_hash   CHAR(64) NOT NULL UNIQUE,
            label        VARCHAR(120) NULL,
            kind         VARCHAR(20) NOT NULL DEFAULT 'api_key',
            created_at   {$now},
            expires_at   DATETIME NOT NULL,
            last_used_at DATETIME NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        'user_links' => "
            {$line},
            user_id    INT NOT NULL,
            kind       VARCHAR(20) NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used_at    DATETIME NULL,
            created_by INT NULL,
            created_at {$now},
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        'settings' => "
            `key` VARCHAR(100) PRIMARY KEY,
            value TEXT NULL",
        'audit_log' => "
            {$line},
            user_id    INT NULL,
            action     VARCHAR(60) NOT NULL,
            entity     VARCHAR(60) NOT NULL,
            entity_id  INT NULL,
            detail     TEXT NULL,
            ip_hash    VARCHAR(64) NULL,
            created_at {$now},
            INDEX idx_audit_entity (entity, id)",

        // CRM.
        'lead_notes' => "
            {$line},
            lead_id    INT NOT NULL,
            user_id    INT NULL,
            type       VARCHAR(20) NOT NULL DEFAULT 'note',
            body       TEXT NOT NULL,
            created_at {$now},
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)",
        'clients' => "
            {$line},
            name       VARCHAR(160) NOT NULL,
            company    VARCHAR(190) NULL,
            email      VARCHAR(190) NULL,
            phone      VARCHAR(40) NULL,
            address    TEXT NULL,
            tax_id     VARCHAR(40) NULL,
            state_code VARCHAR(2) NULL,
            notes      TEXT NULL,
            lead_id    INT NULL,
            created_at {$now},
            FOREIGN KEY (lead_id) REFERENCES leads(id)",
        'contracts' => "
            {$line},
            client_id             INT NOT NULL,
            title                 VARCHAR(200) NOT NULL,
            type                  VARCHAR(30) NOT NULL DEFAULT 'project',
            start_date            DATE NULL,
            end_date              DATE NULL,
            value                 DOUBLE NOT NULL DEFAULT 0,
            status                VARCHAR(20) NOT NULL DEFAULT 'active',
            renewal_reminder_days INT NOT NULL DEFAULT 30,
            file_path             VARCHAR(255) NULL,
            file_name             VARCHAR(160) NULL,
            notes                 TEXT NULL,
            created_at            {$now},
            FOREIGN KEY (client_id) REFERENCES clients(id)",

        // Projects and people's work.
        'projects' => "
            {$line},
            name        VARCHAR(200) NOT NULL,
            client_id   INT NULL,
            description TEXT NULL,
            status      VARCHAR(20) NOT NULL DEFAULT 'active',
            start_date  DATE NULL,
            deadline    DATE NULL,
            budget      DOUBLE NOT NULL DEFAULT 0,
            created_by  INT NULL,
            created_at  {$now},
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'project_members' => "
            project_id INT NOT NULL,
            user_id    INT NOT NULL,
            rate       DOUBLE NULL,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)",
        'tasks' => "
            {$line},
            project_id      INT NOT NULL,
            title           VARCHAR(255) NOT NULL,
            description     TEXT NULL,
            assignee_id     INT NULL,
            status          VARCHAR(20) NOT NULL DEFAULT 'todo',
            priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
            due_date        DATE NULL,
            estimated_hours DOUBLE NULL,
            fixed_amount    DOUBLE NOT NULL DEFAULT 0,
            payout_id       INT NULL,
            created_by      INT NULL,
            created_at      {$now},
            updated_at      {$now},
            completed_at    DATETIME NULL,
            INDEX idx_tasks_assignee (assignee_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (assignee_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'timesheets' => "
            {$line},
            user_id     INT NOT NULL,
            project_id  INT NOT NULL,
            task_id     INT NULL,
            date        DATE NOT NULL,
            hours       DOUBLE NOT NULL,
            description TEXT NULL,
            status      VARCHAR(20) NOT NULL DEFAULT 'pending',
            reviewed_by INT NULL,
            reviewed_at DATETIME NULL,
            payout_id   INT NULL,
            created_at  {$now},
            INDEX idx_timesheets_user (user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (task_id) REFERENCES tasks(id),
            FOREIGN KEY (reviewed_by) REFERENCES users(id)",
        'daily_reports' => "
            {$line},
            user_id         INT NOT NULL,
            date            DATE NOT NULL,
            summary         TEXT NOT NULL,
            tasks_completed TEXT NULL,
            blockers        TEXT NULL,
            plan_tomorrow   TEXT NULL,
            hours           DOUBLE NULL,
            created_at      {$now},
            updated_at      {$now},
            UNIQUE KEY uq_report_day (user_id, date),
            INDEX idx_reports_date (date),
            FOREIGN KEY (user_id) REFERENCES users(id)",
        'payouts' => "
            {$line},
            user_id        INT NOT NULL,
            period_start   DATE NOT NULL,
            period_end     DATE NOT NULL,
            hours          DOUBLE NOT NULL DEFAULT 0,
            hours_amount   DOUBLE NOT NULL DEFAULT 0,
            task_amount    DOUBLE NOT NULL DEFAULT 0,
            adjustments    DOUBLE NOT NULL DEFAULT 0,
            total          DOUBLE NOT NULL DEFAULT 0,
            status         VARCHAR(20) NOT NULL DEFAULT 'pending',
            paid_date      DATE NULL,
            payment_method VARCHAR(30) NULL,
            reference      VARCHAR(120) NULL,
            expense_id     INT NULL,
            notes          TEXT NULL,
            created_by     INT NULL,
            created_at     {$now},
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",

        // Sales and accounting.
        'services' => "
            {$line},
            name        VARCHAR(160) NOT NULL,
            description TEXT NULL,
            unit        VARCHAR(20) NULL,
            hsn_sac     VARCHAR(20) NULL,
            rate        DOUBLE NOT NULL DEFAULT 0,
            gst_rate    DOUBLE NOT NULL DEFAULT 18,
            active      TINYINT NOT NULL DEFAULT 1,
            created_at  {$now},
            updated_at  {$now}",
        'quotations' => "
            {$line},
            number      VARCHAR(40) NOT NULL UNIQUE,
            client_id   INT NULL,
            lead_id     INT NULL,
            title       VARCHAR(200) NULL,
            issue_date  DATE NOT NULL,
            valid_until DATE NULL,
            status      VARCHAR(20) NOT NULL DEFAULT 'draft',
            discount    DOUBLE NOT NULL DEFAULT 0,
            tax_rate    DOUBLE NOT NULL DEFAULT 0,
            subtotal    DOUBLE NOT NULL DEFAULT 0,
            total       DOUBLE NOT NULL DEFAULT 0,
            {$taxColumns},
            notes       TEXT NULL,
            terms       TEXT NULL,
            created_by  INT NULL,
            created_at  {$now},
            updated_at  {$now},
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'quotation_items' => "
            {$line},
            quotation_id INT NOT NULL,
            {$itemColumns},
            FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE",
        'recurring_invoices' => "
            {$line},
            client_id       INT NOT NULL,
            contract_id     INT NULL,
            title           VARCHAR(200) NOT NULL,
            frequency       VARCHAR(20) NOT NULL DEFAULT 'monthly',
            next_date       DATE NOT NULL,
            anchor_day      INT NULL,
            end_date        DATE NULL,
            auto_send       TINYINT NOT NULL DEFAULT 0,
            active          TINYINT NOT NULL DEFAULT 1,
            discount        DOUBLE NOT NULL DEFAULT 0,
            tax_rate        DOUBLE NOT NULL DEFAULT 0,
            notes           TEXT NULL,
            last_invoice_id INT NULL,
            created_by      INT NULL,
            created_at      {$now},
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (contract_id) REFERENCES contracts(id)",
        'recurring_items' => "
            {$line},
            recurring_id INT NOT NULL,
            {$itemColumns},
            FOREIGN KEY (recurring_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE",
        'invoices' => "
            {$line},
            number              VARCHAR(40) NOT NULL UNIQUE,
            doc_type            VARCHAR(20) NOT NULL DEFAULT 'invoice',
            client_id           INT NOT NULL,
            quotation_id        INT NULL,
            project_id          INT NULL,
            recurring_id        INT NULL,
            original_invoice_id INT NULL,
            duplicated_from     INT NULL,
            issue_date          DATE NOT NULL,
            due_date            DATE NULL,
            po_number           VARCHAR(60) NULL,
            status              VARCHAR(20) NOT NULL DEFAULT 'draft',
            discount            DOUBLE NOT NULL DEFAULT 0,
            tax_rate            DOUBLE NOT NULL DEFAULT 0,
            subtotal            DOUBLE NOT NULL DEFAULT 0,
            total               DOUBLE NOT NULL DEFAULT 0,
            {$taxColumns},
            amount_paid         DOUBLE NOT NULL DEFAULT 0,
            adjustment          DOUBLE NOT NULL DEFAULT 0,
            note_reason         TEXT NULL,
            notes               TEXT NULL,
            terms               TEXT NULL,
            company_snapshot    MEDIUMTEXT NULL,
            client_snapshot     TEXT NULL,
            issued_at           DATETIME NULL,
            issued_by           INT NULL,
            cancelled_at        DATETIME NULL,
            cancelled_by        INT NULL,
            cancel_reason       TEXT NULL,
            created_by          INT NULL,
            created_at          {$now},
            updated_at          {$now},
            INDEX idx_invoices_issue (issue_date),
            INDEX idx_invoices_status (doc_type, status),
            INDEX idx_invoices_original (original_invoice_id),
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (quotation_id) REFERENCES quotations(id),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'invoice_items' => "
            {$line},
            invoice_id INT NOT NULL,
            {$itemColumns},
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE",
        'payments' => "
            {$line},
            invoice_id INT NOT NULL,
            amount     DOUBLE NOT NULL,
            date       DATE NOT NULL,
            method     VARCHAR(30) NULL,
            reference  VARCHAR(120) NULL,
            notes      TEXT NULL,
            created_by INT NULL,
            created_at {$now},
            INDEX idx_payments_date (date),
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'invoice_history' => "
            {$line},
            invoice_id INT NOT NULL,
            action     VARCHAR(40) NOT NULL,
            reason     TEXT NULL,
            changes    MEDIUMTEXT NULL,
            snapshot   MEDIUMTEXT NULL,
            pdf_path   VARCHAR(255) NULL,
            user_id    INT NULL,
            user_name  VARCHAR(120) NULL,
            created_at {$now},
            INDEX idx_invoice_history (invoice_id)",
        'doc_sequences' => "
            series      VARCHAR(100) PRIMARY KEY,
            last_number INT NOT NULL",
        'expenses' => "
            {$line},
            date           DATE NOT NULL,
            category       VARCHAR(80) NOT NULL,
            vendor         VARCHAR(160) NULL,
            description    TEXT NULL,
            amount         DOUBLE NOT NULL,
            payment_method VARCHAR(30) NULL,
            reference      VARCHAR(120) NULL,
            project_id     INT NULL,
            payout_id      INT NULL,
            file_path      VARCHAR(255) NULL,
            file_name      VARCHAR(160) NULL,
            created_by     INT NULL,
            created_at     {$now},
            INDEX idx_expenses_date (date),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'other_income' => "
            {$line},
            date           DATE NOT NULL,
            category       VARCHAR(80) NOT NULL,
            source         VARCHAR(160) NULL,
            description    TEXT NULL,
            amount         DOUBLE NOT NULL,
            payment_method VARCHAR(30) NULL,
            reference      VARCHAR(120) NULL,
            file_path      VARCHAR(255) NULL,
            file_name      VARCHAR(160) NULL,
            created_by     INT NULL,
            created_at     {$now},
            INDEX idx_income_date (date),
            FOREIGN KEY (created_by) REFERENCES users(id)",

        // Support and automation.
        'tickets' => "
            {$line},
            number            VARCHAR(40) NOT NULL UNIQUE,
            client_id         INT NULL,
            contract_id       INT NULL,
            project_id        INT NULL,
            subject           VARCHAR(255) NOT NULL,
            description       TEXT NULL,
            channel           VARCHAR(20) NOT NULL DEFAULT 'phone',
            priority          VARCHAR(20) NOT NULL DEFAULT 'medium',
            status            VARCHAR(20) NOT NULL DEFAULT 'open',
            assignee_id       INT NULL,
            response_due_at   DATETIME NOT NULL,
            resolve_due_at    DATETIME NOT NULL,
            first_response_at DATETIME NULL,
            resolved_at       DATETIME NULL,
            created_by        INT NULL,
            created_at        {$now},
            updated_at        {$now},
            INDEX idx_tickets_status (status),
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (assignee_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)",
        'ticket_comments' => "
            {$line},
            ticket_id  INT NOT NULL,
            user_id    INT NULL,
            body       TEXT NOT NULL,
            internal   TINYINT NOT NULL DEFAULT 0,
            created_at {$now},
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)",
        // Admin-only: each member's percentage of a project. Kept apart from project_members so
        // team screens (and editing the team) never touch it.
        'project_shares' => "
            project_id INT NOT NULL,
            user_id    INT NOT NULL,
            percent    DOUBLE NOT NULL,
            updated_by INT NULL,
            updated_at {$now},
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)",
        'job_runs' => "
            {$line},
            job        VARCHAR(40) NOT NULL,
            run_date   DATE NOT NULL,
            status     VARCHAR(20) NOT NULL,
            detail     MEDIUMTEXT NULL,
            created_at {$now},
            INDEX idx_job_runs (job, run_date)",
    ];
}

/**
 * Protection that holds even outside the app (phpMyAdmin, a bug): invoice history can't be
 * changed or deleted, and issued invoices can't be deleted. Shared hosts sometimes don't let
 * the database user create triggers; the app enforces the same rules itself either way.
 */
const SCHEMA_TRIGGERS = [
    'invoice_history_locked_update' => "BEFORE UPDATE ON invoice_history FOR EACH ROW
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LOCKED: Invoice history cannot be changed.'",
    'invoice_history_locked_delete' => "BEFORE DELETE ON invoice_history FOR EACH ROW
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LOCKED: Invoice history cannot be deleted.'",
    'invoices_locked_delete' => "BEFORE DELETE ON invoices FOR EACH ROW BEGIN
        IF OLD.issued_at IS NOT NULL OR OLD.status <> 'draft' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LOCKED: Issued invoices cannot be deleted. Cancel it instead.';
        END IF;
    END",
];

/** Later schema changes: version => list of SQL statements. */
function schema_upgrades(): array
{
    return [
        2 => ['CREATE TABLE IF NOT EXISTS project_shares (' . schema_tables()['project_shares'] . ') ' . TABLE_OPTIONS],
    ];
}

/** Create or upgrade the schema when app_meta says it is behind. Cheap when up to date. */
function ensure_schema(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS app_meta (name VARCHAR(100) PRIMARY KEY, value TEXT NULL) ' . TABLE_OPTIONS);
    $version = (int) $pdo->query("SELECT value FROM app_meta WHERE name = 'schema_version'")->fetchColumn();
    if ($version >= SCHEMA_VERSION) {
        return;
    }
    // One request does the work; others wait for it.
    $pdo->query("SELECT GET_LOCK('chromolog_schema', 60)");
    try {
        $version = (int) $pdo->query("SELECT value FROM app_meta WHERE name = 'schema_version'")->fetchColumn();
        if ($version < 1) {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach (schema_tables() as $table => $columns) {
                $pdo->exec("CREATE TABLE IF NOT EXISTS {$table} ({$columns}) " . TABLE_OPTIONS);
            }
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
            create_schema_triggers($pdo);
            $version = 1;
        }
        foreach (schema_upgrades() as $v => $statements) {
            if ($v > $version) {
                foreach ($statements as $sql) {
                    $pdo->exec($sql);
                }
                $version = $v;
            }
        }
        $pdo->prepare("INSERT INTO app_meta (name, value) VALUES ('schema_version', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")
            ->execute([(string) $version]);
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('chromolog_schema')");
    }
}

function create_schema_triggers(PDO $pdo): void
{
    $created = [];
    foreach (SCHEMA_TRIGGERS as $name => $body) {
        try {
            $pdo->exec("DROP TRIGGER IF EXISTS {$name}");
            $pdo->exec("CREATE TRIGGER {$name} {$body}");
            $created[] = $name;
        } catch (PDOException $e) {
            error_log("Chromolog: trigger {$name} not created (database permissions): " . $e->getMessage());
        }
    }
    $pdo->prepare("INSERT INTO app_meta (name, value) VALUES ('triggers', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")
        ->execute([implode(',', $created)]);
}
