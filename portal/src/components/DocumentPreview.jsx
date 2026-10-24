import { useState } from "react";
import { money, date } from "../lib/format";
import { docTitle, stateName, brandingUrl } from "../lib/gst";
import { useAuth } from "../lib/auth";

/**
 * On-screen version of the PDF for an invoice, credit/debit note or quotation.
 * doc.company / doc.client are the details frozen on an issued invoice (live ones for drafts).
 */
export default function DocumentPreview({ doc, kind }) {
  const { settings } = useAuth();
  const c = doc.company || {};
  const cl = doc.client || {};
  const taxed = doc.supply_type === "intra" || doc.supply_type === "inter";
  const intra = doc.supply_type === "intra";
  const isInvoice = kind === "invoice";
  const items = doc.items || [];
  const hasDiscount = items.some((i) => Number(i.discount) > 0);
  const hasHsn = items.some((i) => i.hsn_sac);
  // Issued invoices show the images frozen on them; drafts and quotations the current ones.
  const frozen = kind !== "quotation" && doc.status !== "draft";
  const img = (k) => (!c[`${k}_file`] ? null : frozen ? brandingUrl(k, { invoiceId: doc.id }) : brandingUrl(k, { version: settings[`${k}_version`] }));
  const bank = [
    ["Account name", c.bank_account_name], ["Bank", [c.bank_name, c.bank_branch].filter(Boolean).join(", ")],
    ["Account no.", c.bank_account_number], ["IFSC", c.bank_ifsc], ["UPI ID", c.upi_id],
  ].filter(([, v]) => v);
  const rates = {};
  if (taxed) {
    for (const it of items) {
      const k = Number(it.gst_rate);
      rates[k] ??= { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      rates[k].taxable += Number(it.taxable_value ?? it.amount);
      rates[k].cgst += Number(it.cgst);
      rates[k].sgst += Number(it.sgst);
      rates[k].igst += Number(it.igst);
    }
  }
  const Row = ({ label, value, strong }) => (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}><dt className={strong ? "" : "text-slate-500"}>{label}</dt><dd className="tabular-nums text-right">{value}</dd></div>
  );
  const fmtDate = (d) => (d ? date(d) : "—");

  return (
    <article className="print-area bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-9 text-sm text-slate-800">
      <header className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="min-w-0">
          <Img src={img("logo")} alt="" className="max-h-14 max-w-[190px] mb-2" />
          <div className="text-lg font-bold text-slate-900">{c.company_name}</div>
          <div className="text-slate-500 whitespace-pre-line">{c.company_address}</div>
          <div className="text-slate-500">{[c.company_phone, c.company_email].filter(Boolean).join(" · ")}</div>
          {c.tax_id && <div><span className="font-medium">GSTIN:</span> {c.tax_id}</div>}
          {c.company_pan && <div><span className="font-medium">PAN:</span> {c.company_pan}</div>}
          {taxed && c.company_state && <div><span className="font-medium">State:</span> {stateName(settings, c.company_state)}</div>}
        </div>
        <div className="sm:text-right shrink-0">
          <div className="text-xl font-bold tracking-wide text-brand-700 uppercase">{docTitle(kind, doc.supply_type)}</div>
          {doc.status === "cancelled" && <div className="inline-block mt-1 border-2 border-red-600 text-red-600 font-bold px-2 text-sm">CANCELLED</div>}
          <dl className="mt-2 space-y-0.5 text-sm sm:min-w-64">
            <Row label="Number" value={<b>{kind !== "quotation" && doc.status === "draft" ? "Draft (numbered when issued)" : doc.number}</b>} />
            <Row label="Date" value={fmtDate(doc.issue_date)} />
            {isInvoice && <Row label="Due date" value={fmtDate(doc.due_date)} />}
            {kind === "quotation" && <Row label="Valid until" value={fmtDate(doc.valid_until)} />}
            {doc.po_number && <Row label="PO / WO no." value={doc.po_number} />}
            {(taxed || doc.supply_type === "exempt") && <Row label="Place of supply" value={stateName(settings, doc.place_of_supply)} />}
            {taxed && <Row label="Reverse charge" value={doc.reverse_charge ? "Yes" : "No"} />}
            {doc.original && <Row label="Against invoice" value={`${doc.original.number} (${fmtDate(doc.original.issue_date)})`} />}
          </dl>
        </div>
      </header>

      <section className="grid sm:grid-cols-5 gap-3 mt-6">
        <div className="sm:col-span-3 rounded-lg border border-slate-200 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{kind === "quotation" ? "Prepared for" : "Bill to"}</div>
          <div className="font-semibold">{cl.company || cl.name}</div>
          {cl.company && cl.name && <div>Attn: {cl.name}</div>}
          {cl.address && <div className="text-slate-500 whitespace-pre-line">{cl.address}</div>}
          {cl.tax_id && <div><span className="font-medium">GSTIN:</span> {cl.tax_id}</div>}
          {cl.state_code && <div><span className="font-medium">State:</span> {stateName(settings, cl.state_code)}</div>}
          <div className="text-slate-500">{[cl.phone, cl.email].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
          {kind === "quotation" && doc.title ? (
            <><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Subject</div><div>{doc.title}</div></>
          ) : doc.note_reason ? (
            <><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Reason</div><div className="whitespace-pre-line">{doc.note_reason}</div></>
          ) : (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{isInvoice ? "Amount due" : "Amount"}</div>
              <div className="text-2xl font-bold tabular-nums">{money(isInvoice ? doc.balance : doc.total)}</div>
              {isInvoice && doc.due_date && Number(doc.balance) > 0 && <div className="text-slate-500">by {fmtDate(doc.due_date)}</div>}
            </>
          )}
        </div>
      </section>

      <div className="overflow-x-auto mt-6 -mx-2 px-2">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="bg-brand-50 text-xs text-slate-600">
              <th className="py-2 px-2 text-left w-8">#</th>
              <th className="py-2 px-2 text-left">Description</th>
              {hasHsn && <th className="py-2 px-2 text-center w-20">HSN/SAC</th>}
              <th className="py-2 px-2 text-center w-20">Qty</th>
              <th className="py-2 px-2 text-right w-24">Rate</th>
              {hasDiscount && <th className="py-2 px-2 text-right w-24">Discount</th>}
              {taxed && <><th className="py-2 px-2 text-right w-24">Taxable</th><th className="py-2 px-2 text-right w-14">GST</th><th className="py-2 px-2 text-right w-24">Tax</th></>}
              <th className="py-2 px-2 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100 align-top">
                <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                <td className="py-2 px-2 whitespace-pre-line">{it.description}</td>
                {hasHsn && <td className="py-2 px-2 text-center">{it.hsn_sac}</td>}
                <td className="py-2 px-2 text-center tabular-nums">{Number(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</td>
                <td className="py-2 px-2 text-right tabular-nums">{money(it.unit_price)}</td>
                {hasDiscount && <td className="py-2 px-2 text-right tabular-nums">{Number(it.discount) ? money(it.discount) : "—"}</td>}
                {taxed && (
                  <>
                    <td className="py-2 px-2 text-right tabular-nums">{money(it.taxable_value)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{Number(it.gst_rate)}%</td>
                    <td className="py-2 px-2 text-right tabular-nums">{money(Number(it.cgst) + Number(it.sgst) + Number(it.igst))}</td>
                  </>
                )}
                <td className="py-2 px-2 text-right tabular-nums">{money(taxed ? it.line_total : (it.taxable_value ?? it.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount in words</div>
          <div className="font-medium">{doc.amount_in_words}</div>
          {taxed && (
            <table className="w-full text-xs mt-3 border border-slate-200">
              <thead><tr className="bg-slate-50 text-slate-500"><th className="py-1 px-2 text-left">GST rate</th><th className="py-1 px-2 text-right">Taxable</th>{intra ? <><th className="py-1 px-2 text-right">CGST</th><th className="py-1 px-2 text-right">SGST</th></> : <th className="py-1 px-2 text-right">IGST</th>}</tr></thead>
              <tbody>
                {Object.entries(rates).map(([rate, r]) => (
                  <tr key={rate} className="border-t border-slate-100"><td className="py-1 px-2">{rate}%</td><td className="py-1 px-2 text-right tabular-nums">{money(r.taxable)}</td>{intra ? <><td className="py-1 px-2 text-right tabular-nums">{money(r.cgst)}</td><td className="py-1 px-2 text-right tabular-nums">{money(r.sgst)}</td></> : <td className="py-1 px-2 text-right tabular-nums">{money(r.igst)}</td>}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <dl className="space-y-1">
          <Row label="Subtotal" value={money(doc.subtotal)} />
          {Number(doc.discount) > 0 && <Row label="Discount" value={`−${money(doc.discount)}`} />}
          {taxed && (
            <>
              <Row label="Taxable value" value={money(doc.taxable_value)} />
              {intra ? <><Row label="CGST" value={money(doc.cgst)} /><Row label="SGST" value={money(doc.sgst)} /></> : <Row label="IGST" value={money(doc.igst)} />}
            </>
          )}
          {!taxed && Number(doc.tax_rate) > 0 && <Row label={`${c.tax_label || "Tax"} (${Number(doc.tax_rate)}%)`} value={money(doc.total - (doc.subtotal - doc.discount))} />}
          <div className="border-t border-slate-300 pt-1.5 text-base"><Row label="Grand total" value={money(doc.total)} strong /></div>
          {!!doc.reverse_charge && <p className="text-xs text-slate-500">GST of {money(doc.tax_total)} is payable by the recipient under reverse charge.</p>}
          {isInvoice && Number(doc.adjustment) !== 0 && <Row label="Credit/debit notes" value={money(doc.adjustment)} />}
          {isInvoice && Number(doc.amount_paid) > 0 && <Row label="Amount received" value={`−${money(doc.amount_paid)}`} />}
          {isInvoice && (Number(doc.amount_paid) > 0 || Number(doc.adjustment) !== 0) && <Row label="Balance due" value={money(doc.balance)} strong />}
        </dl>
      </div>

      {isInvoice && (bank.length > 0 || c.bank_details || c.payment_methods || c.upi_qr_file) && (
        <section className="mt-6 rounded-lg border border-slate-200 p-3 flex gap-4 justify-between">
          <div className="text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment details</div>
            {bank.map(([k, v]) => <div key={k}><span className="text-slate-500">{k}:</span> <b>{v}</b></div>)}
            {c.bank_details && <div className="text-slate-500 whitespace-pre-line mt-1">{c.bank_details}</div>}
            {c.payment_methods && <div className="mt-1"><span className="text-slate-500">We accept:</span> {c.payment_methods}</div>}
            {doc.due_date && <div><span className="text-slate-500">Payment due by:</span> {fmtDate(doc.due_date)}</div>}
          </div>
          <Img src={img("upi_qr")} alt="UPI QR code" className="h-24 w-24 object-contain" />
        </section>
      )}

      <footer className="mt-6 grid sm:grid-cols-3 gap-6 text-xs text-slate-600">
        <div className="sm:col-span-2 space-y-2">
          {doc.notes && <div><div className="font-semibold text-slate-700">Notes</div><p className="whitespace-pre-line">{doc.notes}</p></div>}
          {doc.terms && <div><div className="font-semibold text-slate-700">Terms &amp; conditions</div><p className="whitespace-pre-line">{doc.terms}</p></div>}
          {kind !== "quotation" && c.invoice_declaration && <div><div className="font-semibold text-slate-700">Declaration</div><p className="whitespace-pre-line">{c.invoice_declaration}</p></div>}
        </div>
        <div className="text-center">
          <div>For <b>{c.company_name}</b></div>
          <div className="h-20 flex items-center justify-center gap-2">
            <Img src={img("seal")} alt="" className="max-h-16 max-w-20" />
            <Img src={img("signature")} alt="" className="max-h-14 max-w-32" />
          </div>
          {c.signatory_name && <div className="font-semibold text-slate-800">{c.signatory_name}</div>}
          <div className="border-t border-slate-300 pt-0.5">{c.signatory_title || "Authorised Signatory"}</div>
        </div>
      </footer>
      {c.thank_you_message && <div className="text-center mt-6 font-semibold text-brand-700">{c.thank_you_message}</div>}
    </article>
  );
}

/** Image that hides itself if there is none (or it can't load). */
function Img({ src, ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img src={src} onError={() => setFailed(true)} {...props} />;
}
