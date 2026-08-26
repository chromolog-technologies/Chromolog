/**
 * Chromolog Analytics Utility
 * GA4-ready event tracking. Replace G-XXXXXXXXXX with your real Measurement ID.
 * To enable: uncomment the gtag script in index.html and set your ID.
 */

const isBrowser = () => typeof window !== "undefined";
const isGA = () => isBrowser() && typeof window.gtag === "function";
const hasDataLayer = () => isBrowser() && Array.isArray(window.dataLayer);

/** Track a custom event */
export function trackEvent(category, action, label = "", value = 0) {
  const payload = {
    event_category: category,
    event_label: label,
    value,
  };

  if (hasDataLayer()) {
    window.dataLayer.push({
      event: "chromolog_event",
      chromolog_category: category,
      chromolog_action: action,
      chromolog_label: label,
      chromolog_value: value,
    });
  }

  if (isGA()) window.gtag("event", action, payload);
  if (isBrowser() && typeof window.fbq === "function") window.fbq("trackCustom", action, payload);
  if (isBrowser() && typeof window.lintrk === "function") window.lintrk("track", { conversion_id: action });
  if (isBrowser() && typeof window.clarity === "function") window.clarity("event", `${category}_${action}`);
}

/** Track SPA page view (call on route change) */
export function trackPageView(pagePath, pageTitle = document.title) {
  if (hasDataLayer()) {
    window.dataLayer.push({
      event: "chromolog_page_view",
      page_path: pagePath,
      page_title: pageTitle,
    });
  }

  if (isGA()) window.gtag("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });

  if (isBrowser() && typeof window.clarity === "function") {
    window.clarity("set", "page_path", pagePath);
  }
}

/** Track CTA button clicks */
export function trackCTA(buttonId, destination = "") {
  trackEvent("CTA", "click", buttonId);
  if (destination) trackEvent("Navigation", "cta_navigate", destination);
}

/** Track contact form submission with official GA4 generate_lead event */
export function trackFormSubmit(formName = "contact_form", service = "") {
  if (hasDataLayer()) {
    window.dataLayer.push({
      event: "generate_lead",
      lead_source: formName,
      service: service,
    });
  }

  if (isGA()) {
    window.gtag("event", "generate_lead", {
      lead_source: formName,
      service: service,
    });
  }

  if (isBrowser() && typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      content_name: service || formName,
    });
  }
}

/** Track AI chat open */
export function trackChatOpen() {
  trackEvent("AI_Assistant", "open", "chat_widget");
}

/** Track AI chat message sent */
export function trackChatMessage(query = "") {
  trackEvent("AI_Assistant", "message_sent", query.slice(0, 80));
}

/** Track scroll depth milestones (25, 50, 75, 100) */
export function trackScrollDepth(percent) {
  trackEvent("Scroll", "depth", `${percent}%`, percent);
}

/** Track WhatsApp button click */
export function trackWhatsApp() {
  trackEvent("Communication", "whatsapp_click", "floating_button");
}

/** Track case study view */
export function trackCaseStudy(projectName = "") {
  trackEvent("Portfolio", "case_study_view", projectName);
}

/** Track newsletter signup */
export function trackNewsletterSignup(source = "blog") {
  trackEvent("Lead", "newsletter_signup", source);
}

// ─── Conversion Tracking (Phase 4) ─────────────────────────────────

/** Track phone number click */
export function trackPhoneClick(number = "") {
  trackEvent("Communication", "phone_click", number);
}

/** Track email link click */
export function trackEmailClick(email = "") {
  trackEvent("Communication", "email_click", email);
}

/** Track demo request submission */
export function trackDemoRequest(source = "contact_form") {
  trackEvent("Conversion", "demo_request", source);
}

/** Track file/resource download */
export function trackDownload(fileName = "") {
  trackEvent("Engagement", "download", fileName);
}

/** Track search query in AI assistant */
export function trackSearchQuery(query = "") {
  trackEvent("Search", "ai_search", query.slice(0, 80));
}

/** Track recommendation interaction */
export function trackRecommendation(type = "", item = "") {
  trackEvent("Recommendation", "click", `${type}:${item}`);
}

/** Track section visibility (for recommendation engine) */
export function trackSectionView(sectionId = "") {
  trackEvent("Engagement", "section_view", sectionId);
}

/** Consent toggle — enable/disable analytics based on cookie consent */
export function setAnalyticsConsent(granted = true) {
  if (!isGA()) return;
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}
