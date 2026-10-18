# Chromolog Growth OS — Phase 1

Lead capture, the control panel, and an optional AI Sales Agent.

**Free mode (default):** the website chat answers from its built-in knowledge base and offers a
lead form; the chat form and the contact form post to `lead.php`. No API key or cost.
**AI mode (optional):** build the frontend with `VITE_AI_CHAT_ENABLED=true` and add an
Anthropic API key; the chat then uses `chat.php` (Claude).

- `brain/company-brain.md` — everything the AI knows. Edit this to change its answers.
- `lead.php` — free lead capture used by the chat lead form and the contact form.
- `chat.php` — the Claude-powered chat endpoint (AI mode only).
- `admin.php` — control panel: baseline metrics, leads pipeline, chat transcripts
  (`https://chromologtechnologies.com/api/ai/admin.php`).

In AI mode, every visitor message goes to Claude with the Company Brain. When a visitor shares their name and
an email or phone number, the agent saves them as a scored lead (hot / warm / cold) and the team
gets an email.

## One-time setup

1. **API key (AI mode only, skip for free mode)**: create a key at https://console.anthropic.com, add billing, and set a monthly
   spend limit (Settings → Limits).
2. **Hostinger PHP**: in hPanel → Advanced → PHP Configuration, choose PHP 8.2 or newer and make
   sure `pdo_sqlite` and `curl` are enabled.
3. **Private config**: in hPanel File Manager, create the folder
   `domains/chromologtechnologies.com/chromolog-private/` (next to `public_html`, **not** inside it).
   Upload `config.example.php` there as `config.php` and fill in:
   - `anthropic_api_key` (leave as is in free mode)
   - `admin_password_hash`: run `php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"`
   - `ip_salt`: run `php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"`
   - `smtp_password`: the password of the `info@chromologtechnologies.com` mailbox (hPanel →
     Emails). Lead emails are sent through Hostinger SMTP because the domain's DMARC policy
     rejects unauthenticated mail.
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
