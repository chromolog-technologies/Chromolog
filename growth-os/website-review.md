# Website & system review — 2026-10-18

Full review of chromologtechnologies.com, the growth-api backend and the deploy setup.
Ordered by impact. ✅ = I can do it; 👤 = needs your decision or action.

## P1 — Critical (losing leads or hurting Google today)

1. **Five forms send nothing.** They show "thank you" but the data is thrown away:
   Free Consultation page (`FreeConsultation.jsx`), the quote form on every service page
   (`ServiceDetail.jsx`), the Digital Audit quiz (`DigitalAuditModal.jsx`), the blog newsletter
   (`Blog.jsx`) and the Careers application with resume upload (`Careers.jsx`).
   ✅ Connect the first four to the lead panel (`lead.php`); 👤 Careers: send applications by
   email (careers@ or info@) instead of a fake upload.
2. **robots.txt blocks `/assets/`** — all JavaScript and CSS. Google can't render a React site
   without them, so most of your content is invisible to search. ✅ Remove that line.
3. **`favicon.svg` is 1.8 MB** (a PNG wrapped in SVG), downloaded on every visit.
   ✅ Replace with a small favicon (the existing 96×96 PNG / .ico are fine).
4. **Microsoft Clarity is installed with the placeholder `YOUR_PROJECT_ID`** — it loads and
   errors on every page. 👤 Give me your Clarity project ID, or ✅ I remove it.
5. **Dead admin area at `/admin`.** A public login page from the old, never-deployed Laravel
   backend; it can't work (`/api/v1` doesn't exist). ✅ Remove the `/admin` route, the old admin
   pages, the unused `backend/` folder and the `VITE_API_BASE_URL` setting. Your real panel is
   `/api/ai/admin.php`.

## P2 — Important

6. **Service worker caches every page you open**, including the lead control panel (with
   client personal data) in the browser's storage, and can serve stale pages after a deploy.
   ✅ Exclude `/api/` and refresh the cache version on each deploy.
7. **Privacy policy is out of date** (last updated 4 July 2026). It doesn't mention Google
   Analytics, Clarity, cookies, the website chat, or that leads are stored in our own database
   and emailed to the team. Needed under India's DPDP Act. ✅ Draft the update; 👤 approve it.
8. **Products page "Coming Soon" list**: 10 products with release dates — two already passed
   (Q3 2026: AI Proposal Generator, AI Resume Builder) — and several marked "In Development"
   (Restaurant ERP, Retail POS, Clinic Management, AI Invoice…). You confirmed only HumaNode and
   AlphaGrew as products. 👤 Which are real plans? ✅ Remove the rest or drop the dates.
9. **Dubai / UAE pages** say "Company in Dubai, UAE", "UAE VAT & WPS statutory compliance",
   "Dedicated GCC client coordination", "24/7 cloud monitoring". 👤 Do you have a UAE presence
   or these capabilities? ✅ Otherwise reword to "serving Dubai & UAE businesses from Kerala".
10. **"100% source code & IP ownership" and "24/7 monitoring"** appear across the site.
    👤 Confirm your contracts say this.
11. **Lead database has no backup.** If the Hostinger file is lost, so are the leads.
    👤 Export CSV from the panel weekly, or ✅ I add an automatic daily copy.
12. **Deploy uses an SSH password.** Safer and more reliable with an SSH key (it also avoids the
    lockouts we hit). ✅ Update the workflow; 👤 add the key in hPanel and GitHub. Also update the
    GitHub Actions versions (Node 20 deprecation warnings).
13. **No testimonials.** 👤 Ask GMC for a short quote with permission; ✅ I re-enable the section.

## P3 — Clean-up & speed

14. **Repo clutter**: old root copies of the site (`index.html`, `sw.js`, `sitemap.xml`,
    favicons…), `ChatGPT Image … .png` (1.6 MB), 3D experiment folders (`scratch_gen`,
    `scratch_glb`), demo HTML files, a zip, and the build output `frontend/dist` still tracked
    despite `.gitignore`. ✅ Remove from git (files stay on your Mac).
15. **Heavy assets**: `chromolog logo transparent.png` 2.5 MB (used by the 3D scenes),
    `chronolog_logo_3d.glb` 1.8 MB, two logo videos 3.5 MB, plus unused `3d-logo.png` and
    `chronolog_logo_3d_fixed (1).glb`. ✅ Compress to WebP / Draco and delete unused files.
16. **CSS bundle is 223 kB**; a few unused imports flagged by lint. ✅ Tidy.

---

## Status — P1 done (2026-10-18)

- 1 ✅ Free Consultation, service quote, Digital Audit and newsletter forms now save to the
  lead panel (sources `free_consultation`, `service_quote`, `digital_audit`, `newsletter`) and
  email the team. Careers applications are emailed to info@ with the resume attached
  (`growth-api/careers.php`; PDF/Word up to 5 MB, nothing stored on the server).
- 2 ✅ robots.txt no longer blocks `/assets/`; `/api/` is disallowed instead.
- 3 ✅ The 1.8 MB `favicon.svg` is removed; the PNG / ICO favicons remain.
- 4 ✅ Correction: Clarity was already commented out, so it never loaded. The leftover block
  and its CSP entries are removed. To add Clarity later, create a free project at
  clarity.microsoft.com and send the project ID.
- 5 ✅ `/admin`, the old admin pages, the auth context, `axios`, `backend/` and
  `VITE_API_BASE_URL` are removed. `/admin` now shows the normal 404 page.
