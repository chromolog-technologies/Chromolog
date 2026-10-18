# Website claims review

Every factual claim on chromologtechnologies.com that a prospect could check. For each one,
mark **Keep** (true, and you could show proof if asked), **Fix** (write the real number), or
**Remove**. Then send me the list and I'll update the site.

Rule of thumb: if you couldn't show a client the evidence on a call, remove it. One caught
exaggeration costs more trust than ten honest, smaller numbers earn.

---

## 1. Contradictions — fix first (visitors see both on the home page)

| # | Where | Says | Conflicts with |
|---|---|---|---|
| 1.1 | Testimonials stats (`Testimonials.jsx:55`) | **50+** Projects Delivered | Projects stats say **12+** Projects Completed (`Projects.jsx:196`) |
| 1.2 | Testimonials stats (`Testimonials.jsx:58`) | **12** Industries Served | Projects stats say **6+** (`Projects.jsx:197`); index.html and the chat say "12+" |
| 1.3 | Testimonials stats (`Testimonials.jsx:56`) | **98%** Client Satisfaction | Projects stats say **99%** (`Projects.jsx:199`). Was satisfaction ever measured? |
| 1.4 | Testimonials stats (`Testimonials.jsx:57`) | **6x** Average ROI | No basis shown anywhere |
| 1.5 | Projects stats (`Projects.jsx:198`) | **100+** Modules Delivered | — |

**Your real numbers:** projects delivered ____ · industries ____ · remove satisfaction/ROI? ____

## 2. Testimonials with named people — highest risk

Named quotes must be real, said by that person, and published with their permission. Under
Indian consumer protection rules, fake or unapproved endorsements are a real legal risk, and
anyone can look these people up.

| # | Person | Company | Notes |
|---|---|---|---|
| 2.1 | Dr. Anish K. Kumar, Director of IT Operations | Medical College Chest Hospital | Quote praises an "offline-first" queue system. Is this person real and did they approve it? Company name should be "GMC Chest Hospital, Thrissur" if kept |
| 2.2 | Prof. Priya Nair, Head of Placements & Admissions | "AlphaGrew Partner University" | Quote claims "8,500 profiles last semester" |
| 2.3 | Thomas Joseph, Chief Operating Officer | YCDC Enterprise Group | YCDC is listed as "In Development" in Projects, but the quote describes a deployed system |

If they aren't real and approved: remove them, and I'll replace the section with the GMC
Chest Hospital project (live, verifiable) until you collect real reviews. Google Business
Profile reviews are the best source.

## 3. Results claimed for specific projects

| # | Where | Claim |
|---|---|---|
| 3.1 | Industry Explorer, Healthcare (`IndustryExplorer.jsx:20`) | "42% reduction in patient wait times", "Full compliance with healthcare data standards" |
| 3.2 | Products, healthcare (`products.js:372-373`) | "Cut OP wait times by 60%", "60% shorter queues" — also conflicts with 42% above |
| 3.3 | Blog (`Blog.jsx:121`) | Chest Hospital "guaranteeing 100% check-in reliability" |
| 3.4 | Chat answers (`AIChat.jsx:145`) | "HIPAA-ready architecture" (HIPAA is a US law; usually irrelevant in Kerala and implies certification) |
| 3.5 | AlphaGrew (`Projects.jsx:87`, `IndustryExplorer.jsx:33`, `AIChat.jsx:149`) | "92% online fee collection", "10,000+ students", "85% placement workload cut", "8,500+ placement applications per semester" |
| 3.6 | AlphaGrew (`products.js:384`) | "3x placement throughput", "tripled drive efficiency" |
| 3.7 | YCDC (`Projects.jsx:49`, `IndustryExplorer.jsx:85`) | "84% less paper", "12 hours saved per approval loop", "100% audit trace" — while status says "In Development" |
| 3.8 | HumaNode (`Projects.jsx:68`) | "99.8% biometric capture reliability" — while status says "Architecture Completed" |
| 3.9 | Retail (`IndustryExplorer.jsx:46`) | "3x faster checkout process" |
| 3.10 | Restaurant (`IndustryExplorer.jsx:59`) | "40% faster order-to-kitchen", "table turnover improved by 25%" |

## 4. Case Studies page (anonymous clients, very specific numbers)

These name no client, so they can't be checked — but the numbers read as measured results.
Are these real projects? If they are examples, they should be labelled as such or removed.

| # | Case study | Claims |
|---|---|---|
| 4.1 | Retail CRM — "Regional Retail & Wholesale Network", Kochi | 75% less manual time, 3x faster dispatch, 0 discrepancies, +240% rep orders, "12 branch managers" |
| 4.2 | HRMS — "Multi-Specialty Hospital Network", Kerala & UAE | 450+ shifts, 85% fewer HR hours, "5 days → 2 hrs" payroll, 0% overtime errors, 40+ hours/month |
| 4.3 | Website redesign — "Leading Industrial Equipment Supplier", Kochi | +320% enquiries, −64% bounce rate, "Top 3" Google rank |
| 4.4 | LMS — "Premier Coaching Academy", Kerala | 90% faster fees, 15,000+ mock tests monthly, 100% digital records |
| 4.5 | Services FAQ (`servicesData.js:752`) | "Our client case studies demonstrate an average of 65% to 80% reduction in manual data entry hours" |

## 5. Capability and quality claims

| # | Where | Claim |
|---|---|---|
| 5.1 | AI showcase (`AIShowcase.jsx:26,29,130`) | "99% accuracy" document processing; "98.4%" figure |
| 5.2 | Horizontal showcase (`HorizontalScrollShowcase.jsx:51`) | "99.4% Accuracy" |
| 5.3 | Products (`products.js:278,288,298`) | "10x faster screening", "99% field accuracy", "40+ languages" |
| 5.4 | Blog (`Blog.jsx:29`) | Invoice parsing "with 99% accuracy" |
| 5.5 | Process (`Process.jsx:225-226`) | "Average Lighthouse page speed: 96+", "Security vulnerability checks: 100% Passed" |
| 5.6 | Business core (`BusinessCore.jsx:41,43`) | "3x Inbound Leads", "100% Automated" |
| 5.7 | Products hero (`ProductsHero.jsx:23`) | "16+ Products & Platforms" |
| 5.8 | Services (`servicesData.js:376`) | Flutter cuts "development costs by up to 40%" (general industry claim — fine if phrased as "up to") |

## 6. Company facts

| # | Where | Claim |
|---|---|---|
| 6.1 | About timeline (`About.jsx:47-51`) | Founded **2022**; 2023 "delivered ERP and queue displays for retail and education centers" |
| 6.2 | index.html structured data, chat | "serving clients globally across 12+ industries" |

## Probably fine (promises, not results)

"100% source code & IP ownership", "100% tailored to your business", "24/7 monitoring",
"Lighthouse 95+ target", "website 3+ years old" — these are commitments or targets. Keep them
only if your contracts and support plans actually include them (e.g. do you really provide
24/7 monitoring?).

---

## Status — updated 2026-10-18

Fixed using the confirmed facts (GMC = only completed client project, with ongoing support;
YCDC = development complete, in client testing; HumaNode = own SaaS, demo available;
AlphaGrew = own SaaS; everything else = built to order):

- Sections 1, 3, 4, 5 and the 2023 About milestone: invented numbers and past-project claims
  removed or replaced with factual statements.
- Section 2: testimonials section hidden until real, client-approved quotes exist
  (`App.jsx`; the component is kept for later).
- Case Studies page now shows only GMC Chest Hospital.

Still open: confirm the founding year (2022) and the other About timeline years, and whether
the "100% IP ownership" and "24/7 monitoring" promises match your contracts.
