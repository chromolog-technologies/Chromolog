<?php

/**
 * Copy this file to the PRIVATE folder on Hostinger (outside public_html):
 *   /home/u818464796/domains/chromologtechnologies.com/chromolog-private/config.php
 * and fill in the values. Never commit the real file.
 */
return [
    // From https://console.anthropic.com → API keys. Set a monthly spend limit there too.
    'anthropic_api_key' => 'sk-ant-...',
    'model' => 'claude-opus-5-5',

    // MySQL database (hPanel → Databases → MySQL Databases). On Hostinger the host is 'localhost'.
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'u818464796_chromolog',
        'user' => 'u818464796_...',
        'password' => '',
    ],
    // The old SQLite file. If it exists and the MySQL database is empty, its data is copied into
    // MySQL once, automatically. The file itself is left as it is.
    'db_path' => __DIR__ . '/growth.sqlite',

    // First portal admin login (created automatically on first use): admin_email + this password.
    'admin_email' => 'info@chromologtechnologies.com',
    // Generate with: php -r "echo password_hash('your-password', PASSWORD_DEFAULT), PHP_EOL;"
    'admin_password_hash' => '',

    // Company portal: uploaded bills and contracts (keep outside public_html) and business timezone.
    'uploads_path' => __DIR__ . '/uploads',
    'timezone' => 'Asia/Kolkata',
    // Daily backups (zip of database + uploads); newest N are kept.
    'backup_path' => __DIR__ . '/backups',
    'backup_keep' => 14,
    // Every backup zip is locked with this password (AES-256). Generate one with:
    //   php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"
    // and keep a copy somewhere safe OUTSIDE the server (e.g. your password manager): without it the backups can't be opened.
    'backup_password' => '',
    // Off-site copy of each daily backup. 'google_drive' (connect it once on Admin → Automation & backups),
    // or 'email' with 'email' => 'a-separate-private-inbox@example.com' (up to 'max_mb' => 20). Leave method empty to keep backups on the server only.
    'offsite_backup' => ['method' => 'google_drive'],
    // Google Drive: an OAuth client ("Web application") from Google Cloud Console; see the portal README, Back-ups.
    'google_drive' => [
        'client_id' => '',
        'client_secret' => '',
        'keep' => 60, // copies kept in the Drive folder; older ones are deleted
    ],

    // Random string used to hash visitor IPs. Generate with: php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"
    'ip_salt' => '',

    // New-lead notifications, sent through Hostinger SMTP as a real mailbox (the domain's
    // DMARC policy rejects anything else). Use the mailbox's own password from hPanel → Emails.
    'notify_email' => 'info@chromologtechnologies.com',
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,
    'smtp_user' => 'info@chromologtechnologies.com',
    'smtp_password' => '',

    'allowed_origins' => ['https://chromologtechnologies.com'],

    // How long visitor data is kept (the daily clean-up deletes older records; see the privacy policy).
    // Automatic thank-you email to each new website lead (wording: lead_thank_you_text in src/leads.php).
    // On unless this says false. Put your Cal.com link in booking_url to include it in the email.
    'lead_thank_you' => ['enabled' => true, 'booking_url' => '', 'whatsapp' => '+91 94002 30723'],
    'retention' => ['requests_days' => 30, 'chat_months' => 12],

    // Guardrails
    'rate_limit_per_hour' => 30,   // messages per visitor per hour
    'daily_message_cap' => 1500,   // total AI replies per day across all visitors
];
