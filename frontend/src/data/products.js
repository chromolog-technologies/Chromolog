// ─── Chromolog Products — Central Data Layer ─────────────────────────────────
// Single source of truth for the Products ecosystem page. All showcase cards,
// AI products, industry solutions, roadmap, and the product-detail modal read
// from here so content stays consistent and easy to extend.

// ── Status system ────────────────────────────────────────────────────────────
// key → { label, color(css var group), dot } used by <StatusBadge />
export const STATUS = {
  live: { label: "Live", tone: "success" },
  featured: { label: "Featured", tone: "accent" },
  enterprise: { label: "Enterprise", tone: "primary" },
  development: { label: "In Development", tone: "secondary" },
  beta: { label: "Beta", tone: "purple" },
  concept: { label: "Concept", tone: "warning" },
  soon: { label: "Coming Soon", tone: "muted" },
};

// Quick-filter chips surfaced in the toolbar
export const QUICK_FILTERS = [
  { id: "all", label: "All Products", icon: "ri-apps-2-line" },
  { id: "ai", label: "AI", icon: "ri-sparkling-2-line" },
  { id: "enterprise", label: "Enterprise", icon: "ri-building-4-line" },
  { id: "saas", label: "SaaS", icon: "ri-cloud-line" },
  { id: "healthcare", label: "Healthcare", icon: "ri-heart-pulse-line" },
  { id: "education", label: "Education", icon: "ri-graduation-cap-line" },
  { id: "retail", label: "Retail", icon: "ri-store-2-line" },
];

export const CATEGORIES = [
  "All",
  "SaaS Platform",
  "Education ERP",
  "Enterprise HRMS",
  "Healthcare",
  "CRM",
  "Artificial Intelligence",
];

// ── Featured Products ────────────────────────────────────────────────────────
export const FEATURED_PRODUCTS = [
  {
    id: "alphagrew",
    name: "Alphagrew",
    category: "Education ERP",
    status: "featured",
    icon: "ri-graduation-cap-line",
    gradient: ["#4f46e5", "#00e5ff"],
    accent: "#00e5ff",
    tags: ["ai", "enterprise"],
    industries: ["education"],
    tech: ["React", "Laravel", "Python", "PostgreSQL", "OpenAI"],
    tagline: "AI-powered smart campus & placement automation.",
    description:
      "AI-powered campus management platform with placement automation, an AI resume analyzer, LMS, attendance, and deep student analytics.",
    features: [
      "Placement Automation",
      "AI Resume Analyzer",
      "Learning Management",
      "Smart Attendance",
      "Student Analytics",
      "Recruiter Portal",
      "Fee Management",
      "Alumni Network",
    ],
    hasDemo: true,
    detail: {
      overview:
        "Alphagrew is a smart-campus ERP that unifies admissions, learning, attendance and placements. Its AI layer scores student readiness, matches candidates to openings, and gives placement cells a real-time command center.",
      problem:
        "Colleges run placements on spreadsheets and email chains. Student data is fragmented across departments, recruiters get generic shortlists, and leadership has no live view of outcomes.",
      audience: ["Universities & colleges", "Placement cells", "Training & development teams", "Recruiters"],
      featureGroups: [
        { title: "Placement engine", items: ["AI candidate matching", "Recruiter portal", "Drive scheduling", "Offer tracking"] },
        { title: "Academics", items: ["LMS & assessments", "Biometric attendance", "Fee & finance", "Parent portal"] },
        { title: "Intelligence", items: ["Readiness scoring", "AI resume analyzer", "Outcome dashboards", "Alumni analytics"] },
      ],
      architecture: [
        "React SPA with role-based dashboards for students, faculty and recruiters",
        "Laravel modular monolith with Redis-backed job queues",
        "Python microservice for resume parsing & placement-prediction models",
        "PostgreSQL warehouse feeding executive analytics",
      ],
      roadmap: ["Mock-interview AI", "Skill-gap learning paths", "Employer-branded microsites", "Mobile app for students"],
    },
  },
  {
    id: "humanode-hrms",
    name: "HumaNode HRMS",
    category: "Enterprise HRMS",
    status: "soon",
    icon: "ri-team-line",
    gradient: ["#06b6d4", "#4f46e5"],
    accent: "#06b6d4",
    tags: ["ai", "enterprise"],
    industries: ["enterprise", "finance"],
    tech: ["Laravel", "React", "PostgreSQL", "Redis", "Docker"],
    tagline: "Modern, AI-native HR for the whole employee lifecycle.",
    description:
      "A modern AI-powered HR platform spanning recruitment, payroll, attendance, employee analytics, and performance management.",
    features: [
      "Recruitment ATS",
      "Payroll Automation",
      "Biometric Attendance",
      "Performance Reviews",
      "Employee Analytics",
      "Leave & Shifts",
      "Self-Service Portal",
      "Compliance",
    ],
    hasDemo: false,
    detail: {
      overview:
        "HumaNode is an AI-native HRMS that manages people from applicant to alumnus — hiring, onboarding, payroll, attendance, and performance — with analytics that predict attrition before it happens.",
      problem:
        "HR teams stitch together five disconnected tools. Payroll errors, manual attendance, and gut-feel performance reviews cost money and morale, with no early warning on flight-risk talent.",
      audience: ["Mid-market enterprises", "HR & people teams", "Finance/payroll", "Distributed workforces"],
      featureGroups: [
        { title: "Hire & onboard", items: ["Applicant tracking", "Offer workflows", "Digital onboarding", "Document vault"] },
        { title: "Operate", items: ["Payroll automation", "Biometric attendance", "Leave & shift planning", "Compliance"] },
        { title: "Grow", items: ["Goal & OKR reviews", "Attrition prediction", "Engagement pulse", "People analytics"] },
      ],
      architecture: [
        "Laravel + Sanctum API with per-tenant isolation",
        "React employee & manager self-service portals",
        "Redis queues for payroll runs and biometric sync",
        "Dockerized deploys with audit logging for compliance",
      ],
      roadmap: ["AI interview scheduling", "Skills marketplace", "Sentiment-based engagement", "Mobile-first ESS"],
    },
  },
  {
    id: "hospital-token",
    name: "Hospital Token Management",
    category: "Healthcare",
    status: "enterprise",
    icon: "ri-hospital-line",
    gradient: ["#22c55e", "#06b6d4"],
    accent: "#22c55e",
    tags: ["enterprise"],
    industries: ["healthcare"],
    tech: ["Flutter", "Laravel", "PostgreSQL", "Firebase"],
    tagline: "Zero-chaos queues for hospitals and clinics.",
    description:
      "Hospital queue management with online booking, doctor dashboards, live token displays, notifications, analytics, and reporting.",
    features: [
      "Online Booking",
      "Live Token Display",
      "Doctor Dashboard",
      "Smart Notifications",
      "Department Routing",
      "Wait-time Analytics",
      "Multi-branch",
      "Reporting",
    ],
    hasDemo: true,
    detail: {
      overview:
        "A digital token and queue platform that replaces crowded waiting rooms with online booking, live display screens, and push notifications that tell patients exactly when to arrive.",
      problem:
        "Outpatient departments overflow with walk-ins. Patients wait for hours with no visibility, staff shout out numbers, and administrators have no data on bottlenecks or peak load.",
      audience: ["Hospitals & OP departments", "Multi-specialty clinics", "Diagnostic labs", "Polyclinics"],
      featureGroups: [
        { title: "Patients", items: ["Online appointment booking", "Live queue position", "SMS/push alerts", "Feedback capture"] },
        { title: "Clinical staff", items: ["Doctor console", "Department routing", "Call-next & recall", "Multi-branch"] },
        { title: "Admin", items: ["Wait-time analytics", "Load heatmaps", "Custom reports", "Display-screen manager"] },
      ],
      architecture: [
        "Flutter apps for patients + waiting-room display screens",
        "Laravel real-time token engine with WebSocket broadcasts",
        "Firebase Cloud Messaging for instant notifications",
        "PostgreSQL analytics store for wait-time reporting",
      ],
      roadmap: ["AI wait-time prediction", "Insurance & billing hooks", "Tele-consult queue", "Voice announcements"],
    },
  },
  {
    id: "ai-crm",
    name: "AI CRM Platform",
    category: "CRM",
    status: "concept",
    icon: "ri-customer-service-2-line",
    gradient: ["#7c3aed", "#f472b6"],
    accent: "#7c3aed",
    tags: ["ai", "saas"],
    industries: ["retail", "finance"],
    tech: ["Next.js", "Python", "PostgreSQL", "OpenAI", "Redis"],
    tagline: "A CRM that scores, writes, and closes with you.",
    description:
      "A next-generation CRM with AI lead scoring, WhatsApp integration, email automation, sales analytics, and workflow automation.",
    features: [
      "AI Lead Scoring",
      "WhatsApp Integration",
      "Email Automation",
      "Sales Pipeline",
      "Workflow Builder",
      "Revenue Analytics",
      "Smart Reminders",
      "Team Inbox",
    ],
    hasDemo: false,
    detail: {
      overview:
        "An AI-first CRM that ranks every lead by likelihood to close, drafts follow-ups in your voice, and automates the busywork so sales teams spend time selling, not updating records.",
      problem:
        "Sales reps chase cold leads while hot ones go stale. Data entry eats selling time, follow-ups slip, and managers can't forecast because the pipeline is always out of date.",
      audience: ["SMB & mid-market sales teams", "Agencies", "D2C & retail brands", "B2B services"],
      featureGroups: [
        { title: "Capture", items: ["Omni-channel intake", "WhatsApp & web forms", "Auto-enrichment", "Deduplication"] },
        { title: "Convert", items: ["AI lead scoring", "Email/WhatsApp sequences", "Smart reminders", "Team inbox"] },
        { title: "Close", items: ["Pipeline & forecasting", "Revenue analytics", "Workflow automation", "Quote generation"] },
      ],
      architecture: [
        "Next.js dashboard with real-time pipeline board",
        "Python scoring service on historical win/loss data",
        "OpenAI-powered reply drafting with tone control",
        "Redis event bus for automations and WhatsApp webhooks",
      ],
      roadmap: ["Voice-note logging", "Deal-risk alerts", "Meeting summarizer", "Marketplace connectors"],
    },
  },
  {
    id: "ai-analytics",
    name: "AI Business Analytics",
    category: "Artificial Intelligence",
    status: "concept",
    icon: "ri-line-chart-line",
    gradient: ["#00e5ff", "#7c3aed"],
    accent: "#00e5ff",
    tags: ["ai", "enterprise"],
    industries: ["enterprise", "retail", "finance"],
    tech: ["React", "Python", "PostgreSQL", "Claude", "Docker"],
    tagline: "Executive intelligence, forecast to boardroom.",
    description:
      "An enterprise dashboard delivering predictive analytics, KPI tracking, AI forecasting, executive reporting, and business intelligence.",
    features: [
      "Predictive Analytics",
      "KPI Tracking",
      "AI Forecasting",
      "Executive Reports",
      "Anomaly Detection",
      "Natural-language Query",
      "Data Connectors",
      "Auto Insights",
    ],
    hasDemo: false,
    detail: {
      overview:
        "A decision-intelligence layer that connects to your business data, forecasts what's next, flags anomalies automatically, and lets leaders ask questions in plain English.",
      problem:
        "Leaders drown in static dashboards that describe the past. Insights arrive too late, forecasts live in spreadsheets, and no one gets alerted when a KPI quietly breaks.",
      audience: ["Founders & executives", "Finance & ops teams", "Revenue leaders", "Data-driven enterprises"],
      featureGroups: [
        { title: "Connect", items: ["Warehouse & app connectors", "Auto data modeling", "Metric catalog", "Governance"] },
        { title: "Predict", items: ["AI forecasting", "Anomaly detection", "Scenario planning", "Cohort analysis"] },
        { title: "Act", items: ["NL query (ask-your-data)", "Auto-generated insights", "Executive briefings", "Alerts"] },
      ],
      architecture: [
        "React canvas with composable KPI widgets",
        "Python forecasting (Prophet/ML) + anomaly detection jobs",
        "Claude-powered natural-language querying & narrative reports",
        "Dockerized, warehouse-native (PostgreSQL/Snowflake) deployment",
      ],
      roadmap: ["Auto-briefing emails", "Goal tracking", "What-if simulator", "Slack/Teams digests"],
    },
  },
];

// ── AI Products showcase ─────────────────────────────────────────────────────
export const AI_PRODUCTS = [
  {
    id: "resume-analyzer",
    name: "AI Resume Analyzer",
    icon: "ri-file-user-line",
    gradient: ["#4f46e5", "#00e5ff"],
    desc: "Parses, scores and ranks resumes against a role in seconds — with skill-gap insight.",
    useCases: ["Campus placements", "Bulk hiring", "Talent screening"],
    tech: ["Python", "OpenAI", "spaCy"],
    benefits: ["10x faster screening", "Bias-aware scoring", "Skill-gap reports"],
  },
  {
    id: "ocr",
    name: "OCR Platform",
    icon: "ri-scan-2-line",
    gradient: ["#06b6d4", "#4f46e5"],
    desc: "Turns scans, invoices and forms into structured, validated data with high accuracy.",
    useCases: ["Invoice capture", "KYC documents", "Records digitization"],
    tech: ["Python", "Tesseract", "OpenAI"],
    benefits: ["99% field accuracy", "Any language", "Human-in-loop review"],
  },
  {
    id: "voice-ai",
    name: "Voice AI",
    icon: "ri-mic-2-line",
    gradient: ["#7c3aed", "#f472b6"],
    desc: "Real-time speech-to-action: transcribe, understand intent and respond in natural voice.",
    useCases: ["Call centers", "Voice booking", "Accessibility"],
    tech: ["Python", "Whisper", "Gemini"],
    benefits: ["Sub-second latency", "40+ languages", "Sentiment aware"],
  },
  {
    id: "chatbot",
    name: "Conversational Chatbot",
    icon: "ri-chat-smile-3-line",
    gradient: ["#00e5ff", "#22c55e"],
    desc: "Grounded, on-brand assistants that answer from your knowledge base and take actions.",
    useCases: ["Customer support", "Lead capture", "Internal helpdesk"],
    tech: ["Claude", "OpenAI", "Pinecone"],
    benefits: ["24/7 coverage", "RAG-grounded", "Escalation-ready"],
  },
  {
    id: "workflow-automation",
    name: "Workflow Automation",
    icon: "ri-flow-chart",
    gradient: ["#4f46e5", "#7c3aed"],
    desc: "AI agents that route, approve and act across your tools without human babysitting.",
    useCases: ["Ops automation", "Approvals", "Data sync"],
    tech: ["Python", "OpenAI", "Redis"],
    benefits: ["Fewer handoffs", "Auditable steps", "No-code triggers"],
  },
  {
    id: "document-intelligence",
    name: "Document Intelligence",
    icon: "ri-file-search-line",
    gradient: ["#06b6d4", "#7c3aed"],
    desc: "Reads long contracts and reports, extracts clauses and answers questions with citations.",
    useCases: ["Legal review", "Compliance", "Research"],
    tech: ["Claude", "LlamaIndex", "PostgreSQL"],
    benefits: ["Cited answers", "Clause extraction", "Long-context"],
  },
  {
    id: "recommendation-engine",
    name: "AI Recommendation Engine",
    icon: "ri-magic-line",
    gradient: ["#f472b6", "#4f46e5"],
    desc: "Personalizes products, content and next-best-actions from real-time behavior.",
    useCases: ["E-commerce", "Media", "Upsell"],
    tech: ["Python", "PyTorch", "Redis"],
    benefits: ["Higher AOV", "Real-time", "Cold-start ready"],
  },
  {
    id: "image-recognition",
    name: "Image Recognition",
    icon: "ri-image-ai-line",
    gradient: ["#22c55e", "#06b6d4"],
    desc: "Detects, classifies and reads images and video for quality, safety and search.",
    useCases: ["Quality control", "Medical imaging", "Visual search"],
    tech: ["Python", "PyTorch", "OpenCV"],
    benefits: ["Edge-deployable", "Custom classes", "High recall"],
  },
  {
    id: "llm-integration",
    name: "LLM Integration",
    icon: "ri-brain-line",
    gradient: ["#7c3aed", "#00e5ff"],
    desc: "We embed GPT, Claude and Gemini safely into your product with guardrails and evals.",
    useCases: ["Copilots", "Summarization", "Content generation"],
    tech: ["OpenAI", "Claude", "Gemini"],
    benefits: ["Model-agnostic", "Guardrailed", "Cost-optimized"],
  },
];

// ── Enterprise / Industry Solutions ──────────────────────────────────────────
export const INDUSTRIES = [
  {
    id: "healthcare",
    name: "Healthcare",
    icon: "ri-heart-pulse-line",
    color: "#22c55e",
    tagline: "Digital care, shorter queues, better outcomes.",
    products: ["Hospital Token Management", "Clinic Management SaaS", "Tele-consult Suite"],
    technologies: ["Flutter", "Laravel", "Firebase", "PostgreSQL"],
    benefits: ["Cut OP wait times by 60%", "Paperless patient records", "Live capacity analytics"],
    caseStudy: { title: "Chest Hospital App", metric: "60% shorter queues", desc: "Digitized outpatient flow across departments with live token displays." },
  },
  {
    id: "education",
    name: "Education",
    icon: "ri-graduation-cap-line",
    color: "#00e5ff",
    tagline: "Smart campuses from admission to placement.",
    products: ["Alphagrew Campus ERP", "LMS Platform", "AI Placement Suite"],
    technologies: ["React", "Laravel", "Python", "OpenAI"],
    benefits: ["Automated placements", "Unified student data", "AI-driven readiness scoring"],
    caseStudy: { title: "Alphagrew ERP", metric: "3x placement throughput", desc: "AI matching connected students to recruiters and tripled drive efficiency." },
  },
  {
    id: "retail",
    name: "Retail",
    icon: "ri-store-2-line",
    color: "#f59e0b",
    tagline: "Omnichannel commerce that actually converts.",
    products: ["Retail POS SaaS", "AI CRM Platform", "Recommendation Engine"],
    technologies: ["Next.js", "Python", "PostgreSQL", "Redis"],
    benefits: ["Personalized upsell", "Unified inventory", "Real-time sales intelligence"],
    caseStudy: { title: "iPhone Multi-Store Vault", metric: "Unified 8 stores", desc: "Central inventory & sales across branches with live dashboards." },
  },
  {
    id: "hospitality",
    name: "Hospitality",
    icon: "ri-restaurant-2-line",
    color: "#ec4899",
    tagline: "Delight guests, streamline operations.",
    products: ["Restaurant ERP", "Booking Engine", "Event Management System"],
    technologies: ["Next.js", "Laravel", "AWS", "PostgreSQL"],
    benefits: ["Contactless ordering", "Event automation", "Occupancy analytics"],
    caseStudy: { title: "Restaurant ERP", metric: "Orders automated", desc: "End-to-end restaurant management with kitchen display, billing, and analytics." },
  },
  {
    id: "finance",
    name: "Finance",
    icon: "ri-bank-line",
    color: "#4f46e5",
    tagline: "Secure, compliant, automation-first fintech.",
    products: ["AI Invoice Generator", "Business Analytics", "Collections CRM"],
    technologies: ["Laravel", "Python", "PostgreSQL", "Docker"],
    benefits: ["Automated reconciliation", "Fraud & anomaly alerts", "Audit-ready trails"],
    caseStudy: { title: "AI Analytics Suite", metric: "Forecasts in real time", desc: "Predictive KPIs and anomaly alerts for finance leadership." },
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    icon: "ri-tools-line",
    color: "#06b6d4",
    tagline: "Connected factories, predictive uptime.",
    products: ["Production ERP", "Image QC", "IoT Dashboards"],
    technologies: ["Python", "PyTorch", "PostgreSQL", "Docker"],
    benefits: ["Predictive maintenance", "Vision-based QC", "Live floor visibility"],
    caseStudy: { title: "Vision QC Pilot", metric: "Defects caught early", desc: "Camera-based quality control flags defects before shipping." },
  },
  {
    id: "government",
    name: "Government",
    icon: "ri-government-line",
    color: "#7c3aed",
    tagline: "Citizen services, transparent and digital.",
    products: ["Citizen Portals", "Workflow Automation", "Records Digitization"],
    technologies: ["React", "Laravel", "PostgreSQL", "AWS"],
    benefits: ["Paperless workflows", "Transparent tracking", "Secure records"],
    caseStudy: { title: "YCDC Transformation Portal", metric: "End-to-end digital", desc: "Digitized multi-stage citizen workflows with audit trails." },
  },
  {
    id: "construction",
    name: "Construction",
    icon: "ri-building-2-line",
    color: "#f59e0b",
    tagline: "Projects, on time and on budget.",
    products: ["Construction ERP", "Site Tracking", "Vendor CRM"],
    technologies: ["Flutter", "Laravel", "PostgreSQL", "AWS"],
    benefits: ["Live site progress", "Material & cost control", "Vendor coordination"],
    caseStudy: { title: "Site Ops Suite", metric: "One command center", desc: "Unified tracking of sites, materials, labor and billing." },
  },
  {
    id: "logistics",
    name: "Logistics",
    icon: "ri-truck-line",
    color: "#22c55e",
    tagline: "Every shipment, tracked and optimized.",
    products: ["Fleet Platform", "Route Optimizer", "Delivery App"],
    technologies: ["Flutter", "Python", "PostgreSQL", "Redis"],
    benefits: ["Optimized routes", "Live tracking", "Proof of delivery"],
    caseStudy: { title: "Vehicle Service Platform", metric: "Fleet visibility", desc: "Scheduling, tracking and service history in one app." },
  },
];

// ── Coming Soon roadmap products ─────────────────────────────────────────────
export const COMING_SOON = [
  { id: "restaurant-erp", name: "Restaurant ERP", category: "Hospitality", release: "Q4 2026", status: "development", icon: "ri-restaurant-line", desc: "KOT, billing, inventory and multi-outlet analytics for restaurants." },
  { id: "retail-pos", name: "Retail POS SaaS", category: "Retail", release: "Q4 2026", status: "development", icon: "ri-store-3-line", desc: "Cloud POS with inventory, loyalty and omni-channel checkout." },
  { id: "gym-management", name: "Gym Management", category: "Fitness", release: "Q1 2027", status: "concept", icon: "ri-boxing-line", desc: "Memberships, class booking, trainer scheduling and payments." },
  { id: "clinic-management", name: "Clinic Management", category: "Healthcare", release: "Q1 2027", status: "development", icon: "ri-stethoscope-line", desc: "EMR, appointments, billing and pharmacy for clinics." },
  { id: "real-estate-crm", name: "Real Estate CRM", category: "Real Estate", release: "Q2 2027", status: "concept", icon: "ri-home-4-line", desc: "Lead-to-deal pipeline, listings, site visits and follow-ups." },
  { id: "construction-erp", name: "Construction ERP", category: "Construction", release: "Q2 2027", status: "concept", icon: "ri-building-2-line", desc: "Projects, materials, labor, billing and site tracking." },
  { id: "vehicle-service", name: "Vehicle Service Platform", category: "Automotive", release: "Q2 2027", status: "concept", icon: "ri-car-line", desc: "Service booking, job cards, inventory and history." },
  { id: "ai-proposal", name: "AI Proposal Generator", category: "Artificial Intelligence", release: "Q3 2026", status: "beta", icon: "ri-article-line", desc: "Turns a brief into a branded, priced proposal in minutes." },
  { id: "ai-resume-builder", name: "AI Resume Builder", category: "Artificial Intelligence", release: "Q3 2026", status: "beta", icon: "ri-profile-line", desc: "Role-tailored resumes with ATS scoring and rewrite tips." },
  { id: "ai-invoice", name: "AI Invoice Generator", category: "Finance", release: "Q4 2026", status: "development", icon: "ri-bill-line", desc: "Natural-language invoicing with tax, reminders and reconciliation." },
];

// ── Technology orbit ─────────────────────────────────────────────────────────
export const TECH_STACK = [
  { id: "react", name: "React", abbr: "Re", color: "#61DAFB", orbit: 1, kind: "Frontend", desc: "Interactive, component-driven UI for every product surface.", pros: ["Virtual DOM", "Huge ecosystem", "Reusable components"] },
  { id: "nextjs", name: "Next.js", abbr: "Nx", color: "#ffffff", orbit: 1, kind: "Framework", desc: "SSR & edge rendering for SEO-grade, lightning-fast SaaS.", pros: ["SSR/SSG", "Edge runtime", "Image optimization"] },
  { id: "typescript", name: "TypeScript", abbr: "TS", color: "#3178C6", orbit: 1, kind: "Language", desc: "Type-safe code that scales cleanly across large teams.", pros: ["Type safety", "Refactor confidence", "Fewer bugs"] },
  { id: "laravel", name: "Laravel", abbr: "La", color: "#FF2D20", orbit: 1, kind: "Backend", desc: "Elegant PHP framework powering our robust product APIs.", pros: ["Rapid APIs", "Queues & jobs", "Auth built-in"] },
  { id: "flutter", name: "Flutter", abbr: "Fl", color: "#02569B", orbit: 2, kind: "Mobile", desc: "One codebase, native mobile apps for iOS and Android.", pros: ["Native speed", "Single codebase", "Beautiful UI"] },
  { id: "python", name: "Python", abbr: "Py", color: "#3776AB", orbit: 2, kind: "AI/ML", desc: "The engine behind our AI, data and automation services.", pros: ["ML ecosystem", "Fast to build", "Great libraries"] },
  { id: "docker", name: "Docker", abbr: "Dk", color: "#2496ED", orbit: 2, kind: "DevOps", desc: "Containerized, reproducible deploys across every environment.", pros: ["Portable", "Isolated", "CI/CD ready"] },
  { id: "redis", name: "Redis", abbr: "Rd", color: "#DC382D", orbit: 2, kind: "Cache/Queue", desc: "In-memory speed for caching, queues and real-time events.", pros: ["Sub-ms latency", "Pub/Sub", "Job queues"] },
  { id: "postgresql", name: "PostgreSQL", abbr: "PG", color: "#336791", orbit: 3, kind: "Database", desc: "Rock-solid relational store with JSONB and analytics power.", pros: ["ACID", "JSONB", "Scales well"] },
  { id: "aws", name: "AWS", abbr: "AW", color: "#FF9900", orbit: 3, kind: "Cloud", desc: "Global, elastic infrastructure behind our production stack.", pros: ["99.99% uptime", "Global CDN", "Auto-scaling"] },
  { id: "openai", name: "OpenAI", abbr: "Ai", color: "#10a37f", orbit: 3, kind: "LLM", desc: "GPT models for reasoning, generation and agentic workflows.", pros: ["Advanced reasoning", "Function calling", "Fine-tuning"] },
  { id: "claude", name: "Claude", abbr: "Cl", color: "#D97706", orbit: 3, kind: "LLM", desc: "Long-context intelligence for documents and precise extraction.", pros: ["Long context", "Precise extraction", "Reliable"] },
  { id: "gemini", name: "Gemini", abbr: "Gm", color: "#7c3aed", orbit: 3, kind: "LLM", desc: "Multimodal AI across text, code, audio and vision.", pros: ["Multimodal", "Fast", "Workspace-native"] },
];

export const ORBIT_RADIUS = { 1: 95, 2: 155, 3: 215 };

// ── Development philosophy ───────────────────────────────────────────────────
export const PHILOSOPHY = [
  { icon: "ri-sparkling-2-line", title: "AI-First, Not AI-Bolted-On", desc: "Every product is designed around intelligence from day one — not sprinkled on afterwards." },
  { icon: "ri-stack-line", title: "Built to Scale", desc: "Multi-tenant, containerized architectures that grow from first customer to millions of records." },
  { icon: "ri-shield-check-line", title: "Secure & Compliant", desc: "Encryption, role-based access and audit trails baked in — enterprise-ready by default." },
  { icon: "ri-palette-line", title: "Design-Led Engineering", desc: "Premium, accessible interfaces where craft is a feature, not an afterthought." },
  { icon: "ri-rocket-2-line", title: "Ship, Measure, Iterate", desc: "Fast release cycles with analytics wired in so every decision is evidence-based." },
  { icon: "ri-hand-heart-line", title: "Partnership Over Projects", desc: "We build products we'd run ourselves and stay long after launch to help them win." },
];

// ── Roadmap timeline ─────────────────────────────────────────────────────────
export const ROADMAP = [
  { period: "Q3 2026", theme: "AI Utilities", items: ["AI Proposal Generator (Beta)", "AI Resume Builder (Beta)", "LLM guardrail toolkit"], tone: "purple" },
  { period: "Q4 2026", theme: "Vertical SaaS", items: ["Restaurant ERP launch", "Retail POS SaaS", "AI Invoice Generator", "Event Management SaaS"], tone: "secondary" },
  { period: "Q1 2027", theme: "Care & Fitness", items: ["Clinic Management", "Gym Management", "HumaNode HRMS GA"], tone: "success" },
  { period: "Q2 2027", theme: "Field Operations", items: ["Real Estate CRM", "Construction ERP", "Vehicle Service Platform"], tone: "accent" },
];

// ── Helper: flatten everything into a searchable/filterable catalog ──────────
export function buildCatalog() {
  return FEATURED_PRODUCTS.map((p) => ({ ...p, source: "featured" }));
}
