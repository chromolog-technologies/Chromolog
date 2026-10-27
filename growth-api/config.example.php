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

    // Guardrails
    'rate_limit_per_hour' => 30,   // messages per visitor per hour
    'daily_message_cap' => 1500,   // total AI replies per day across all visitors
];
