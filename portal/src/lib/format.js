let currency = { code: "INR", symbol: "₹" };
// Business dates follow the company timezone (from settings), not the viewer's device.
let timeZone = "Asia/Kolkata";

export function setCurrency(code, symbol) {
  currency = { code: code || "INR", symbol: symbol || "" };
}

export function setTimeZone(tz) {
  if (tz) timeZone = tz;
}

export function money(n) {
  const value = Number(n || 0);
  try {
    return new Intl.NumberFormat(currency.code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toFixed(2)}`;
  }
}

export function date(d) {
  if (!d) return "—";
  const dt = new Date(d.length === 10 ? `${d}T00:00:00` : d.replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTime(d) {
  if (!d) return "—";
  const dt = new Date(d.replace(" ", "T") + (d.includes("T") || d.endsWith("Z") ? "" : "Z"));
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone });
}

export function today() {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Add n days to a YYYY-MM-DD date (timezone-safe). */
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function monthStart() {
  return today().slice(0, 8) + "01";
}

const ACRONYMS = { upi: "UPI", amc: "AMC", nda: "NDA", csv: "CSV" };

export function label(s) {
  if (!s) return "—";
  return String(s)
    .replace(/_/g, " ")
    .replace(/\b\w+/g, (w) => ACRONYMS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1));
}

export function hours(n) {
  const v = Number(n || 0);
  return `${Number.isInteger(v) ? v : v.toFixed(2)} h`;
}
