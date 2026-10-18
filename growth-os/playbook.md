# Chromolog Growth Playbook (₹0 plan)

The AI is the research, writing and analysis team; you are the decision-maker and the one who
hits "send". Everything here uses Claude Pro (already paid) and free tools.

## Week 0 — free setup (one afternoon)

| Tool | What to do | Why |
|---|---|---|
| **Google Business Profile** | Create/claim "Chromolog Technologies", category *Software company*, Kochi address or service area (Kerala, UAE), photos, services, website and WhatsApp | Biggest free source of local leads ("software company near me") |
| **Google Search Console** | Already verified (`googled42a1b3ec0cd5cc8.html`). Submit `sitemap.xml`, check it monthly | Shows what people search to find you |
| **Google Analytics 4** | Confirm it receives data; mark `contact_form` submit and chat lead as conversions | Baseline traffic and conversions |
| **WhatsApp Business app** | Business profile, catalogue of services, greeting + away messages, quick replies (`/price`, `/portfolio`, `/call`) | Most Kerala/UAE clients prefer WhatsApp |
| **LinkedIn** | Company page + founders' profiles with clear headline ("We build software & AI for clinics, colleges and retailers in Kerala & UAE") | Credibility + outreach channel |
| **Cal.com** (free) | A 30-minute "Free consultation" booking link | One link to send every prospect |
| **Brevo** (free, ~300 emails/day) | Only for newsletters to people who opted in. Send cold emails one-by-one from your own mailbox | Protects your domain reputation |
| **Control panel** | `chromologtechnologies.com/api/ai/admin.php` | Every lead in one place, with the baseline |

## The daily routine (45–60 minutes)

1. **10 min — Leads.** Open the control panel. Reply to every new lead the same day. Log any
   WhatsApp/phone/referral inquiry with "Add a lead by hand".
2. **20 min — Prospecting.** In the Claude Project, run *Prompt 1* for today's segment
   (rotate: clinics → colleges → retailers/restaurants → UAE SMEs → startups).
3. **15 min — Outreach.** Run *Prompt 2* on the 5 best prospects; review and send 5
   personalised messages yourself. Quality over volume.
4. **5 min — Follow-ups.** Run *Prompt 3* for anyone contacted 3–4 days ago with no reply.

## The weekly routine

- **Monday:** *Prompt 4* — the week's 3 LinkedIn posts + 1 blog idea. Schedule them.
- **Wednesday:** *Prompt 5* — one SEO blog article for the website.
- **Friday:** export the leads CSV, upload it to the project, run *Prompt 6* (weekly review).

## Prompt library

**Prompt 1 — Find prospects**
> Find 15 [private clinics / CBSE schools / supermarkets / restaurants] in [Ernakulam /
> Thrissur / Dubai] that would benefit from [token system / campus ERP / billing &
> inventory / QR ordering]. Use web search. For each: name, website, city, decision-maker
> role to contact, a public sign they need us (e.g. no online booking, outdated site), and a
> fit score 1–5 against our ideal customer profile. Table format, best fit first.

**Prompt 2 — Write outreach**
> Write a cold email and a WhatsApp/LinkedIn message for [prospect name, website, notes].
> Open with something specific about them, connect it to one problem we solve, mention one
> relevant project from our case studies, and end with an invitation to a free 20-minute call
> ([Cal.com link]). Include an opt-out line in the email.

**Prompt 3 — Follow-up**
> Write a short, polite follow-up (under 60 words) to [name] who didn't reply to this
> message: [paste]. Add new value (a quick idea or relevant example), don't repeat the pitch.

**Prompt 4 — Weekly content**
> Write 3 LinkedIn posts for this week for Kerala/UAE business owners: one practical tip
> about [topic], one story from our case studies, one myth vs reality about software/AI
> costs. Plus one blog title with an outline targeting a search people in Kerala make.

**Prompt 5 — SEO article**
> Write a 900-word article for our website: "[title]". Audience: [segment] in Kerala.
> Practical, no fluff, include a cost/timeline section using our indicative ranges with the
> caveat, a short FAQ, and a call to action for a free consultation. Suggest a meta title
> (≤60 chars) and meta description (≤155 chars).

**Prompt 6 — Weekly review**
> Here is this week's leads export. Analyse: leads by source and segment, which segments
> reply and convert, response times, and what to change next week. Give me the 3 most
> important actions and update our 30-day targets.

**Prompt 7 — Sales call prep and proposal**
> I have a call with [name, company, notes from the lead record]. Give me: 5 discovery
> questions, likely objections with answers, and a one-page proposal outline with a price
> range from our brain file.

## 30-day goal

Days 1–30: measure the real baseline (the control panel does this) and test which segment
responds best. At day 30, run Prompt 6 on the full month and set monthly targets for leads,
meetings, proposals and wins. If the website chat is getting real use, consider switching
on the Claude-powered chat (`VITE_AI_CHAT_ENABLED=true` + API key on Claude Haiku) — a few
dollars a month.

## Rules we never break

- Business contacts only; one-to-one messages; honest subject lines; easy opt-out.
- No bought lists, no scraping personal data, no LinkedIn automation tools.
- Never promise a price or date before a scoping call.
