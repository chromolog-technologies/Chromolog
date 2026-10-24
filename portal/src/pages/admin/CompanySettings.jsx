import { useEffect, useRef, useState } from "react";
import { Upload, X, ImageOff } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { brandingUrl } from "../../lib/gst";
import { useApi, useAction, PageHeader, Card, Button, Input, Textarea, Select, Loading, Modal } from "../../components/ui";

/** Details printed on invoices. Issued invoices keep the values they were issued with unless the admin applies changes. */
const INVOICE_KEYS = [
  "company_name", "company_address", "company_email", "company_phone", "company_website", "tax_id", "company_pan", "company_state",
  "bank_account_name", "bank_name", "bank_branch", "bank_account_number", "bank_ifsc", "upi_id", "bank_details", "payment_methods",
  "invoice_declaration", "signatory_name", "signatory_title", "thank_you_message",
];

const IMAGES = [
  ["logo", "Company logo", "Shown at the top of invoices and quotations."],
  ["seal", "Company seal / stamp", "Printed next to the signature."],
  ["signature", "Authorised signature", "A scan of the signature on a white or clear background."],
  ["upi_qr", "UPI QR code", "Optional. Printed with the payment details."],
];

export default function CompanySettings() {
  const { settings, refreshSettings } = useAuth();
  const [f, setF] = useState(null);
  const [run, busy] = useAction();
  const [applyOpen, setApplyOpen] = useState(false);
  const next = useApi("invoices/next-number");

  // Load the form once; later refreshes (e.g. after an image upload) must not wipe unsaved edits.
  useEffect(() => {
    if (settings && !f) {
      setF({
        ...settings,
        expense_categories: settings.expense_categories.join("\n"),
        income_categories: settings.income_categories.join("\n"),
      });
    }
  }, [settings, f]);

  if (!f) return <Loading />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target.checked ? "1" : "0") : e.target.value });

  const save = () => run(async () => {
    const changedInvoiceDetails = INVOICE_KEYS.some((k) => (f[k] ?? "") !== (settings[k] ?? ""));
    await api("settings", { method: "PUT", body: f });
    await refreshSettings();
    next.reload();
    if (changedInvoiceDetails) setApplyOpen(true);
  }, "Settings saved");

  const fyExample = f.invoice_number_fy === "1";

  return (
    <>
      <PageHeader title="Company settings" subtitle="Shown on quotations and invoices." actions={<Button onClick={save} busy={busy}>Save settings</Button>} />
      <div className="space-y-6 max-w-4xl">
        <Card title="Company">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Company name" value={f.company_name} onChange={set("company_name")} />
            <Input label="Website" value={f.company_website} onChange={set("company_website")} />
            <Input label="Email" value={f.company_email} onChange={set("company_email")} />
            <Input label="Mobile / phone" value={f.company_phone} onChange={set("company_phone")} />
            <Select label="State (for GST)" value={f.company_state} onChange={set("company_state")} options={(f.gst_states || []).filter(([c]) => c !== "96").map(([c, n]) => [c, `${n} (${c})`])} />
            <Input label="PAN" value={f.company_pan} onChange={(e) => setF({ ...f, company_pan: e.target.value.toUpperCase() })} maxLength={10} />
          </div>
          <Textarea className="mt-4" label="Office address" rows={2} value={f.company_address} onChange={set("company_address")} />
        </Card>

        <Card title="Logo, seal & signature">
          <div className="grid sm:grid-cols-2 gap-4">
            {IMAGES.map(([kind, title, hint]) => (
              <ImageSlot key={kind} kind={kind} title={title} hint={hint} onChanged={() => setApplyOpen(true)} />
            ))}
          </div>
        </Card>

        <Card title="GST">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.tax_enabled === "1"} onChange={set("tax_enabled")} className="rounded border-slate-300" />
            The company is GST-registered (adds CGST/SGST or IGST to invoices)
          </label>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <Input label="Your GSTIN" value={f.tax_id} onChange={(e) => setF({ ...f, tax_id: e.target.value.toUpperCase().replace(/\s/g, "") })} maxLength={15} />
            <Select label="Default GST rate" value={String(f.default_gst_rate)} onChange={set("default_gst_rate")} options={["0", "5", "12", "18", "28"].map((r) => [r, `${r}%`])} />
            <Input label="Tax name" value={f.tax_label} onChange={set("tax_label")} />
          </div>
        </Card>

        <Card title="Invoice numbering">
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Invoice prefix" value={f.invoice_prefix} onChange={set("invoice_prefix")} maxLength={6} />
            <Input label="Credit note prefix" value={f.credit_note_prefix} onChange={set("credit_note_prefix")} maxLength={6} />
            <Input label="Debit note prefix" value={f.debit_note_prefix} onChange={set("debit_note_prefix")} maxLength={6} />
            <Input label="Start numbering at" type="number" min="1" value={f.invoice_start_number} onChange={set("invoice_start_number")} hint="Only moves forward; numbers already used are never reused." />
            <Input label="Payment terms (days)" type="number" min="0" value={f.payment_terms_days} onChange={set("payment_terms_days")} />
            <Input label="Quotation prefix" value={f.quotation_prefix} onChange={set("quotation_prefix")} />
          </div>
          <label className="flex items-center gap-2 text-sm mt-4">
            <input type="checkbox" checked={fyExample} onChange={set("invoice_number_fy")} className="rounded border-slate-300" />
            Include the financial year and restart numbering every 1 April (e.g. {f.invoice_prefix || "INV"}/26-27/0001)
          </label>
          <p className="text-sm text-slate-500 mt-3">
            Next numbers: <b>{next.data?.numbers.invoice || "…"}</b> · credit note <b>{next.data?.numbers.credit_note || "…"}</b> · debit note <b>{next.data?.numbers.debit_note || "…"}</b>
            <span className="block text-xs text-slate-400 mt-0.5">Numbers are given only when an invoice is issued, so drafts never leave gaps. Save to update the preview.</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Select label="Currency" value={f.currency} onChange={set("currency")} options={[["INR", "INR — Indian rupee"], ["AED", "AED — UAE dirham"], ["USD", "USD — US dollar"]]} />
            <Input label="Currency symbol" value={f.currency_symbol} onChange={set("currency_symbol")} />
          </div>
        </Card>

        <Card title="Bank & payment details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Account name" value={f.bank_account_name} onChange={set("bank_account_name")} />
            <Input label="Account number" value={f.bank_account_number} onChange={set("bank_account_number")} />
            <Input label="Bank name" value={f.bank_name} onChange={set("bank_name")} />
            <Input label="Branch" value={f.bank_branch} onChange={set("bank_branch")} />
            <Input label="IFSC" value={f.bank_ifsc} onChange={(e) => setF({ ...f, bank_ifsc: e.target.value.toUpperCase() })} maxLength={11} />
            <Input label="UPI ID" value={f.upi_id} onChange={set("upi_id")} placeholder="name@bank" />
          </div>
          <Input className="mt-4" label="Accepted payment methods" value={f.payment_methods} onChange={set("payment_methods")} />
          <Textarea className="mt-4" label="Other payment notes (optional)" rows={2} value={f.bank_details} onChange={set("bank_details")} placeholder="e.g. SWIFT code for international transfers" />
        </Card>

        <Card title="Invoice footer & terms">
          <Textarea label="Declaration" rows={2} value={f.invoice_declaration} onChange={set("invoice_declaration")} />
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <Input label="Authorised signatory name" value={f.signatory_name} onChange={set("signatory_name")} />
            <Input label="Signatory title" value={f.signatory_title} onChange={set("signatory_title")} />
            <Input label="Closing message" value={f.thank_you_message} onChange={set("thank_you_message")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Textarea label="Default invoice terms" rows={3} value={f.invoice_terms} onChange={set("invoice_terms")} />
            <Textarea label="Default quotation terms" rows={3} value={f.quotation_terms} onChange={set("quotation_terms")} />
          </div>
        </Card>

        <Card title="Daily digest & reminders">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.reminders_enabled === "1"} onChange={set("reminders_enabled")} className="rounded border-slate-300" />
            Email everyone a morning digest (follow-ups, overdue invoices, renewals, missing reports, tasks, tickets)
          </label>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-600 mb-2">Days a daily report is expected</div>
            <div className="flex flex-wrap gap-2">
              {[["1", "Mon"], ["2", "Tue"], ["3", "Wed"], ["4", "Thu"], ["5", "Fri"], ["6", "Sat"], ["7", "Sun"]].map(([n, d]) => {
                const days = (f.report_days || "").split(",").filter(Boolean);
                const on = days.includes(n);
                return (
                  <button key={n} type="button" onClick={() => setF({ ...f, report_days: (on ? days.filter((x) => x !== n) : [...days, n]).sort().join(",") })}
                    className={`rounded-full px-3 py-1 text-xs ring-1 ${on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-300"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card title="Support ticket targets">
          <p className="text-sm text-slate-500 mb-4">Hours to first response and to resolution for each priority (counted in calendar hours).</p>
          <div className="grid sm:grid-cols-4 gap-4">
            {["urgent", "high", "medium", "low"].map((p) => {
              const [resp, resol] = (f[`sla_${p}`] || "8,72").split(",");
              const setSla = (i) => (e) => {
                const v = [resp, resol];
                v[i] = e.target.value;
                setF({ ...f, [`sla_${p}`]: v.join(",") });
              };
              return (
                <div key={p} className="space-y-2">
                  <div className="text-xs font-semibold capitalize">{p}</div>
                  <Input label="Respond within (h)" type="number" min="1" value={resp} onChange={setSla(0)} />
                  <Input label="Resolve within (h)" type="number" min="1" value={resol} onChange={setSla(1)} />
                </div>
              );
            })}
          </div>
          <Input className="mt-4 max-w-xs" label="Ticket number prefix" value={f.ticket_prefix} onChange={set("ticket_prefix")} />
        </Card>

        <Card title="Accounting categories">
          <div className="grid sm:grid-cols-2 gap-4">
            <Textarea label="Expense categories (one per line)" rows={10} value={f.expense_categories} onChange={set("expense_categories")} />
            <Textarea label="Other income categories (one per line)" rows={10} value={f.income_categories} onChange={set("income_categories")} />
          </div>
        </Card>
      </div>
      {applyOpen && <ApplyModal onClose={() => setApplyOpen(false)} />}
    </>
  );
}

function ImageSlot({ kind, title, hint, onChanged }) {
  const { settings, refreshSettings } = useAuth();
  const [run, busy] = useAction();
  const input = useRef(null);
  const has = settings[`has_${kind}`];
  const upload = (file) => run(async () => {
    const body = new FormData();
    body.append("file", file);
    await api(`settings/branding/${kind}`, { method: "POST", body });
    await refreshSettings();
    onChanged();
  }, `${title} uploaded`);
  const remove = () => run(async () => {
    await api(`settings/branding/${kind}`, { method: "DELETE" });
    await refreshSettings();
    onChanged();
  }, `${title} removed`);
  return (
    <div className="rounded-lg border border-slate-200 p-3 flex gap-3">
      <div className="h-20 w-28 shrink-0 rounded-md bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
        {has ? <img src={brandingUrl(kind, { version: settings[`${kind}_version`] })} alt={title} className="max-h-full max-w-full object-contain" /> : <ImageOff className="h-6 w-6 text-slate-300" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{hint}</div>
        <div className="flex gap-2 mt-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) upload(file); }} />
          <Button size="sm" variant="secondary" icon={Upload} busy={busy} onClick={() => input.current?.click()}>{has ? "Replace" : "Upload"}</Button>
          {has && <Button size="sm" variant="ghost" icon={X} onClick={remove}>Remove</Button>}
        </div>
      </div>
    </div>
  );
}

/** After company details change: keep issued invoices as they are, or apply the new details to all / a period. */
function ApplyModal({ onClose }) {
  const [scope, setScope] = useState("new");
  const [range, setRange] = useState({ from: "", to: "" });
  const [run, busy] = useAction();
  const apply = () => run(async () => {
    if (scope === "new") return onClose();
    const d = await api("settings/apply-to-invoices", { method: "POST", body: { scope, ...range } });
    onClose();
    return d;
  }, scope === "new" ? undefined : "Issued invoices updated (each change is in its history)");
  const option = (value, title, text) => (
    <label className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${scope === value ? "border-brand-500 bg-brand-50/50" : "border-slate-200"}`}>
      <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} className="mt-0.5" />
      <span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="block text-xs text-slate-500">{text}</span></span>
    </label>
  );
  return (
    <Modal open onClose={onClose} title="Update invoices already issued?" footer={<><Button variant="secondary" onClick={onClose}>Not now</Button><Button onClick={apply} busy={busy}>Apply</Button></>}>
      <p className="text-sm text-slate-600">Company details changed. New invoices use them automatically. Issued invoices keep the details they were issued with unless you choose otherwise.</p>
      {option("new", "Only new invoices (recommended)", "Issued invoices stay exactly as they are.")}
      {option("all", "Apply to all invoices", "Every issued invoice is updated. Each change is recorded in that invoice's history.")}
      {option("period", "Apply to a selected period", "Only invoices dated within the period are updated.")}
      {scope === "period" && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
      )}
    </Modal>
  );
}
