# Chromolog Growth OS — Phase 1

The website AI Sales Agent and its control panel.

- `brain/company-brain.md` — everything the AI knows. Edit this to change its answers.
- `chat.php` — the endpoint the website chat widget calls (`/api/ai/chat.php`).
- `admin.php` — control panel: baseline metrics, leads pipeline, chat transcripts
  (`https://chromologtechnologies.com/api/ai/admin.php`).

Every visitor message goes to Claude with the Company Brain. When a visitor shares their name and
an email or phone number, the agent saves them as a scored lead (hot / warm / cold) and the team
gets an email.

## One-time setup

1. **API key**: create a key at https://console.anthropic.com, add billing, and set a monthly
   spend limit (Settings → Limits).
2. **Hostinger PHP**: in hPanel → Advanced → PHP Configuration, choose PHP 8.2 or newer and make
   sure `pdo_sqlite` and `curl` are enabled.
3. **Private config**: in hPanel File Manager, create the folder
   `domains/chromologtechnologies.com/chromolog-private/` (next to `public_html`, **not** inside it).
   Upload `config.example.php` there as `config.php` and fill in:
   - `anthropic_api_key`
   - `admin_password_hash`: run `php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"`
   - `ip_salt`: run `php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"`
4. **Deploy**: push to `main`. GitHub Actions installs dependencies and uploads this folder to
   `public_html/api/ai/`.
5. **Test**: open the website chat and ask a question, then sign in at `/api/ai/admin.php`.

## Local development

```bash
cp config.example.php /some/private/dir/config.php   # fill it in; set allowed_origins to http://localhost:5173
composer install
CHROMOLOG_CONFIG=/some/private/dir/config.php php -S 127.0.0.1:8787
```

Then run the frontend with `VITE_AI_CHAT_URL=http://127.0.0.1:8787/chat.php npm run dev`.

## Guardrails

- The agent answers only from the Company Brain and never promises prices or dates.
- Per-visitor rate limit, a 30-turn limit per chat, and a global daily cap (see `config.php`).
- Visitor IPs are stored only as salted hashes. Secrets and the database live outside `public_html`.
- If the API is unreachable, the widget falls back to its built-in offline answers.
