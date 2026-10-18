// ─── Lead submission ─────────────────────────────────────────────────────────
// Every website form posts here, so inquiries land in the Growth OS control panel
// (/api/ai/admin.php) and the team gets an email.

import { trackFormSubmit } from "./analytics";

const LEAD_URL = import.meta.env.VITE_LEAD_URL || "/api/ai/lead.php";

export const WHATSAPP_FALLBACK = "You can also WhatsApp us at +91 94002 30723.";

/**
 * Send a lead. `fields` uses the lead.php names: full_name, email, phone, company,
 * industry, location, service_interest, budget_range, timeline, summary, session_id.
 * Throws an Error with a visitor-friendly message on failure.
 */
export async function submitLead(source, fields) {
  let res;
  try {
    res = await fetch(LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, source }),
    });
  } catch {
    throw new Error(`Could not send your details. Please check your connection. ${WHATSAPP_FALLBACK}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${data.error || "Could not send your details."} ${WHATSAPP_FALLBACK}`);
  }
  trackFormSubmit(source, fields.service_interest || "unspecified");
}
