/**
 * Chromolog Visitor Intelligence Utility
 * Tracks visitor behavior via localStorage to power the recommendation engine.
 * No backend required — all client-side.
 */

const STORAGE_KEY = "chromolog_visitor";

// ─── Visitor Profile ────────────────────────────────────────────────

function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data — reset
  }
  return {
    visitCount: 0,
    firstVisit: Date.now(),
    lastVisit: Date.now(),
    viewedSections: {},    // { sectionId: viewCount }
    viewedServices: [],    // ["AI Automation", "Mobile Apps"]
    clickedTech: [],       // ["React", "Flutter"]
    selectedIndustry: null,// "healthcare" | "education" | null
    searchHistory: [],     // last 10 AI chat queries
    pageViews: {},         // { "/": 3, "/blog": 1 }
    timeSpent: {},         // { "hero": 12, "services": 8 } (seconds approximation)
    clickedCTAs: [],       // last 20 high-intent actions
  };
}

function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chromolog:visitor-profile", { detail: profile }));
    }
  } catch {
    // Storage full or unavailable
  }
}

// ─── Tracking Functions ─────────────────────────────────────────────

/** Record a new visit (call once per session) */
export function recordVisit() {
  const profile = getProfile();
  if (!sessionStorage.getItem("chromolog_visit_recorded")) {
    profile.visitCount += 1;
    profile.lastVisit = Date.now();
    sessionStorage.setItem("chromolog_visit_recorded", "1");
    saveProfile(profile);
  }
}

/** Track a section becoming visible */
export function trackSectionView(sectionId) {
  const profile = getProfile();
  profile.viewedSections[sectionId] = (profile.viewedSections[sectionId] || 0) + 1;
  saveProfile(profile);
}

/** Track a page view */
export function trackVisitorPageView(pagePath) {
  const profile = getProfile();
  profile.pageViews[pagePath] = (profile.pageViews[pagePath] || 0) + 1;
  saveProfile(profile);
}

/** Track a service being viewed/clicked */
export function trackServiceInterest(serviceName) {
  const profile = getProfile();
  if (!profile.viewedServices.includes(serviceName)) {
    profile.viewedServices.push(serviceName);
    if (profile.viewedServices.length > 20) profile.viewedServices.shift();
    saveProfile(profile);
  }
}

/** Track a technology being clicked */
export function trackTechClick(techName) {
  const profile = getProfile();
  if (!profile.clickedTech.includes(techName)) {
    profile.clickedTech.push(techName);
    if (profile.clickedTech.length > 20) profile.clickedTech.shift();
    saveProfile(profile);
  }
}

/** Track selected industry */
export function trackIndustryInterest(industryName) {
  const profile = getProfile();
  profile.selectedIndustry = industryName;
  saveProfile(profile);
}

/** Track a search query from AI assistant */
export function trackSearchHistory(query) {
  const profile = getProfile();
  profile.searchHistory.push(query.slice(0, 80));
  if (profile.searchHistory.length > 10) profile.searchHistory.shift();
  saveProfile(profile);
}

/** Track high-intent CTA interactions */
export function trackCTAInterest(label) {
  const profile = getProfile();
  profile.clickedCTAs.push({ label: label.slice(0, 80), at: Date.now() });
  if (profile.clickedCTAs.length > 20) profile.clickedCTAs.shift();
  saveProfile(profile);
}

/** Add dwell time for a visible section */
export function updateSectionTime(sectionId, seconds) {
  if (!sectionId || !Number.isFinite(seconds) || seconds <= 0) return;
  const profile = getProfile();
  profile.timeSpent[sectionId] = (profile.timeSpent[sectionId] || 0) + seconds;
  saveProfile(profile);
}

// ─── Recommendation Engine ──────────────────────────────────────────

/** Get the full visitor profile */
export function getVisitorProfile() {
  return getProfile();
}

/** Detect likely industry interest */
export function detectIndustry() {
  const profile = getProfile();
  if (profile.selectedIndustry) return profile.selectedIndustry;

  // Infer from search history and viewed sections
  const text = [
    ...profile.searchHistory,
    ...Object.keys(profile.viewedSections),
    ...profile.viewedServices,
    ...profile.clickedTech,
    ...(profile.clickedCTAs || []).map((cta) => cta.label),
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("health") || text.includes("hospital") || text.includes("clinic") || text.includes("patient"))
    return "healthcare";
  if (text.includes("educ") || text.includes("university") || text.includes("campus") || text.includes("student"))
    return "education";
  if (text.includes("retail") || text.includes("pos") || text.includes("inventory") || text.includes("billing"))
    return "retail";
  if (text.includes("restaurant") || text.includes("food") || text.includes("kitchen"))
    return "hospitality";
  if (text.includes("hr") || text.includes("payroll") || text.includes("attendance") || text.includes("enterprise"))
    return "enterprise";

  return null;
}

/** Generate personalized recommendations */
export function getRecommendations() {
  const profile = getProfile();
  const industry = detectIndustry();
  const recommendations = [];

  // Industry-based recommendations
  const industryMap = {
    healthcare: {
      service: "Healthcare Software Solutions",
      product: "Medical College Token System",
      blog: "AI in Healthcare — Transforming Patient Care",
      cta: "Build a Healthcare App",
    },
    education: {
      service: "Education ERP & Campus Systems",
      product: "AlphaGrew Smart Campus ERP",
      blog: "Smart Campus: AI-Powered University Management",
      cta: "Build a Campus ERP",
    },
    retail: {
      service: "Retail POS & Inventory Solutions",
      product: "Retail Billing & Inventory",
      blog: "Modern POS Systems: Cloud-First Architecture",
      cta: "Build a POS System",
    },
    hospitality: {
      service: "Restaurant & Hospitality Tech",
      product: "QR Ordering Platform",
      blog: "Digital Ordering: Restaurant Tech Revolution",
      cta: "Build a Restaurant App",
    },
    enterprise: {
      service: "Enterprise HRMS & Automation",
      product: "HumaNode HRMS",
      blog: "Enterprise AI Automation: Beyond Chatbots",
      cta: "Build an Enterprise Platform",
    },
  };

  if (industry && industryMap[industry]) {
    const rec = industryMap[industry];
    recommendations.push(
      { type: "service", title: rec.service, reason: `Based on your interest in ${industry}` },
      { type: "product", title: rec.product, reason: `Our ${industry} solution` },
      { type: "blog", title: rec.blog, reason: "Recommended reading" },
    );
  }

  // Engagement-based recommendations
  const sectionCounts = Object.entries(profile.viewedSections);
  if (sectionCounts.length > 0) {
    const timeEntries = Object.entries(profile.timeSpent || {});
    const topSection = timeEntries.length > 0
      ? timeEntries.sort((a, b) => b[1] - a[1])[0][0]
      : sectionCounts.sort((a, b) => b[1] - a[1])[0][0];
    const sectionRecs = {
      home: { type: "cta", title: "Get a Free Architecture Consultation", reason: "You explored the company overview" },
      industries: { type: "cta", title: "Map Your Industry Workflow", reason: "You compared industry solutions" },
      ai: { type: "service", title: "AI & Automation Services", reason: "You showed interest in AI" },
      services: { type: "cta", title: "Request a Free Consultation", reason: "Explore our service options" },
      projects: { type: "cta", title: "View All Case Studies", reason: "See more of our work" },
      product: { type: "product", title: "Request a Product Demo", reason: "See our solutions in action" },
      contact: { type: "cta", title: "Schedule a Scoping Call", reason: "You reached the contact section" },
    };
    if (sectionRecs[topSection]) {
      recommendations.push(sectionRecs[topSection]);
    }
  }

  if (profile.clickedTech.includes("OpenAI") || profile.clickedTech.includes("Gemini")) {
    recommendations.push({
      type: "service",
      title: "LLM Integration Architecture",
      reason: "Based on your AI platform interest",
    });
  }

  // Default fallbacks if no personalization data
  if (recommendations.length === 0) {
    recommendations.push(
      { type: "service", title: "AI-Powered Software Development", reason: "Most popular service" },
      { type: "product", title: "AlphaGrew Smart Campus ERP", reason: "Featured product" },
      { type: "cta", title: "Get a Free Project Estimate", reason: "Start your journey" },
    );
  }

  // Deduplicate by title and limit to 3
  const seen = new Set();
  return recommendations.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  }).slice(0, 3);
}
