// GST helpers shared by the invoice/quotation editor, preview and reports.
// The server repeats every calculation; these give the live totals while typing.

export const SUPPLY_LABELS = {
  intra: "CGST + SGST (same state)",
  inter: "IGST (other state / export)",
  exempt: "GST exempt (Bill of Supply)",
  non_gst: "Non-GST",
};

export const DOC_LABELS = { invoice: "Invoice", credit_note: "Credit note", debit_note: "Debit note", quotation: "Quotation" };

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

export const PAYMENT_METHODS = [["bank_transfer", "Bank transfer"], ["upi", "UPI"], ["cash", "Cash"], ["cheque", "Cheque"], ["card", "Card"], ["other", "Other"]];

export const taxEnabled = (settings) => settings?.tax_enabled === "1";

export function stateName(settings, code) {
  const s = settings?.gst_states?.find(([c]) => c === code);
  if (!s) return "";
  return code === "96" ? s[1] : `${s[1]} (${code})`;
}

/** Same rule as the server: GST invoices are "Tax Invoice", exempt supplies a "Bill of Supply". */
export function docTitle(kind, supplyType) {
  if (kind === "invoice") {
    if (supplyType === "intra" || supplyType === "inter") return "Tax Invoice";
    if (supplyType === "exempt") return "Bill of Supply";
    return "Invoice";
  }
  return DOC_LABELS[kind] || "Invoice";
}

/** Default tax type for a place of supply. */
export function defaultSupply(settings, placeOfSupply) {
  if (!taxEnabled(settings)) return "non_gst";
  return placeOfSupply === settings.company_state ? "intra" : "inter";
}

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcLines(items, supplyType, reverseCharge) {
  const taxed = supplyType === "intra" || supplyType === "inter";
  const rows = items.map((it) => {
    const amount = r2((Number(it.quantity) || 0) * (Number(it.unit_price) || 0));
    const discount = Math.min(Number(it.discount) || 0, amount);
    const taxable = r2(amount - discount);
    const rate = taxed ? Number(it.gst_rate) || 0 : 0;
    const cgst = supplyType === "intra" ? r2((taxable * rate) / 200) : 0;
    const igst = supplyType === "inter" ? r2((taxable * rate) / 100) : 0;
    return { amount, discount, taxable, cgst, sgst: cgst, igst, total: r2(taxable + cgst * 2 + igst) };
  });
  const sum = (k) => r2(rows.reduce((s, r) => s + r[k], 0));
  const tax = r2(sum("cgst") + sum("sgst") + sum("igst"));
  return {
    rows,
    subtotal: sum("amount"),
    discount: sum("discount"),
    taxable: sum("taxable"),
    cgst: sum("cgst"),
    sgst: sum("sgst"),
    igst: sum("igst"),
    tax,
    total: r2(sum("taxable") + (reverseCharge ? 0 : tax)),
  };
}

/** Image uploaded in settings (logo, seal, signature, upi_qr); ?invoice= gives the one frozen on an issued invoice. */
export function brandingUrl(kind, { invoiceId, version } = {}) {
  const base = import.meta.env.VITE_PORTAL_API || "/api/ai/v1";
  const q = new URLSearchParams();
  if (invoiceId) q.set("invoice", invoiceId);
  if (version) q.set("v", version);
  const qs = q.toString();
  return `${base}/branding/${kind}${qs ? `?${qs}` : ""}`;
}
