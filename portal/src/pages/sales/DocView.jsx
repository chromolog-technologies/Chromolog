import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Printer, Pencil, Send, CheckCircle2, XCircle, Receipt, Trash2, Ban, HandCoins, Download, Mail,
  MessageCircle, Copy, FileMinus, FilePlus, History, FileText, ChevronDown, ChevronRight,
} from "lucide-react";
import { api, openFile, downloadFile } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money, date, dateTime, label, today } from "../../lib/format";
import { DOC_LABELS, PAYMENT_METHODS, docTitle } from "../../lib/gst";
import { useApi, useAction, useForm, useToast, Async, Card, Badge, Button, Modal, Input, Select, Textarea, Table, Confirm } from "../../components/ui";
import DocumentPreview from "../../components/DocumentPreview";
import { ReasonModal } from "./DocEditor";

const fileName = (doc) => `${(doc.status === "draft" ? `Draft-${doc.id}` : doc.number).replace(/\//g, "-")}.pdf`;

export default function DocView({ kind }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const isQuote = kind === "quotation";
  const base = isQuote ? "quotations" : "invoices";
  const res = useApi(`${base}/${id}`);
  const [run, busy] = useAction();
  const [modal, setModal] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);

  const reload = () => {
    res.reload();
    setHistoryKey((k) => k + 1);
  };
  const act = (fn, msg) => run(async () => { await fn(); reload(); setModal(null); }, msg);

  const setQuoteStatus = (status) => act(() => api(`quotations/${id}`, { method: "PUT", body: { ...res.data.quotation, status } }), `Marked as ${label(status).toLowerCase()}`);
  const convert = () => run(async () => {
    const d = await api(`quotations/${id}/convert`, { method: "POST" });
    nav(`/invoices/${d.invoice.id}`);
  }, "Draft invoice created from the quotation");
  const remove = () => run(async () => {
    await api(`${base}/${id}`, { method: "DELETE" });
    nav(`/${base}`);
  }, "Deleted");
  const duplicate = () => run(async () => {
    const d = await api(`invoices/${id}/duplicate`, { method: "POST" });
    nav(`/invoices/${d.invoice.id}/edit`);
  }, "Copied to a new draft");

  return (
    <Async result={res}>
      {(data) => {
        const doc = data[kind];
        const docKind = isQuote ? "quotation" : doc.doc_type;
        const isInvoice = docKind === "invoice";
        const draft = !isQuote && doc.status === "draft";
        const live = !isQuote && !["draft", "cancelled"].includes(doc.status);
        const pdfPath = `${base}/${id}/pdf`;
        const titleText = isQuote ? doc.number : draft ? `Draft ${DOC_LABELS[docKind].toLowerCase()}` : doc.number;
        return (
          <>
            <div className="no-print">
              <Link to={doc.original ? `/invoices/${doc.original.id}` : `/${base}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
                <ArrowLeft className="h-4 w-4" /> {doc.original ? `Invoice ${doc.original.number}` : isQuote ? "Quotations" : "Invoices"}
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-semibold mr-1">{titleText}</h1>
                <Badge status={doc.status} />
                {!isQuote && !isInvoice && <Badge tone="brand">{DOC_LABELS[docKind]}</Badge>}
              </div>
              {doc.status === "cancelled" && <p className="text-sm text-red-700 mb-3">Cancelled{doc.cancel_reason ? `: ${doc.cancel_reason}` : ""}</p>}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="secondary" icon={Download} onClick={() => downloadFile(`${pdfPath}?download=1`, fileName(doc))}>PDF</Button>
                <Button variant="secondary" icon={Printer} onClick={() => openFile(pdfPath)}>Print</Button>

                {isQuote && (
                  <>
                    {doc.status !== "invoiced" && <Button variant="secondary" icon={Pencil} onClick={() => nav(`/quotations/${id}/edit`)}>Edit</Button>}
                    {doc.status === "draft" && <Button variant="secondary" icon={Send} busy={busy} onClick={() => setQuoteStatus("sent")}>Mark sent</Button>}
                    {["draft", "sent"].includes(doc.status) && (
                      <>
                        <Button variant="secondary" icon={CheckCircle2} onClick={() => setQuoteStatus("accepted")}>Accepted</Button>
                        <Button variant="secondary" icon={XCircle} onClick={() => setQuoteStatus("rejected")}>Rejected</Button>
                      </>
                    )}
                    {doc.status !== "invoiced" && can(user, "accounts") && <Button icon={Receipt} busy={busy} onClick={convert}>Convert to invoice</Button>}
                    {can(user, "accounts") && doc.status !== "invoiced" && <Button variant="ghost" icon={Trash2} onClick={() => setModal("delete")} aria-label="Delete" />}
                  </>
                )}

                {draft && (
                  <>
                    <Button variant="secondary" icon={Pencil} onClick={() => nav(`/invoices/${id}/edit`)}>Edit</Button>
                    <Button icon={Send} onClick={() => setModal("issue")}>Issue</Button>
                    <Button variant="ghost" icon={Trash2} onClick={() => setModal("delete")}>Delete draft</Button>
                  </>
                )}

                {live && (
                  <>
                    <Button variant="secondary" icon={Mail} onClick={() => setModal("email")}>Email</Button>
                    <Button variant="secondary" icon={MessageCircle} onClick={() => shareWhatsApp(doc, pdfPath)}>WhatsApp</Button>
                    {isInvoice && Number(doc.balance) > 0 && <Button icon={HandCoins} onClick={() => setModal("payment")}>Record payment</Button>}
                    {user.role === "admin" && <Button variant="secondary" icon={Pencil} onClick={() => nav(`/invoices/${id}/edit`)}>Edit</Button>}
                    {isInvoice && <Button variant="secondary" icon={FileMinus} onClick={() => nav(`/invoices/new?note=credit_note&of=${id}`)}>Credit note</Button>}
                    {isInvoice && <Button variant="secondary" icon={FilePlus} onClick={() => nav(`/invoices/new?note=debit_note&of=${id}`)}>Debit note</Button>}
                  </>
                )}
                {!isQuote && isInvoice && !draft && <Button variant="secondary" icon={Copy} busy={busy} onClick={duplicate}>Duplicate</Button>}
                {live && <Button variant="ghost" icon={Ban} onClick={() => setModal("cancel")}>Cancel</Button>}
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 min-w-0">
                <DocumentPreview doc={doc} kind={docKind} />
              </div>

              {!isQuote && (
                <div className="no-print space-y-6 min-w-0">
                  {isInvoice && (
                    <Card title="Payments received" padded={false}>
                      <Table
                        rows={data.payments}
                        empty={draft ? "Issue the invoice to record payments." : "No payments yet."}
                        columns={[
                          { key: "date", label: "Date", render: (r) => date(r.date) },
                          { key: "method", label: "Method", render: (r) => <>{label(r.method)}{r.reference && <div className="text-xs text-slate-400">{r.reference}</div>}</> },
                          { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
                          { key: "x", label: "", render: (r) => (
                            <button onClick={() => setModal({ removePayment: r })} className="text-slate-400 hover:text-red-600" aria-label="Remove payment"><Trash2 className="h-4 w-4" /></button>
                          ) },
                        ]}
                      />
                      <dl className="text-sm space-y-1.5 border-t border-slate-100 px-4 py-3">
                        <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd>{money(doc.total)}</dd></div>
                        {Number(doc.adjustment) !== 0 && <div className="flex justify-between"><dt className="text-slate-500">Credit/debit notes</dt><dd>{money(doc.adjustment)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-slate-500">Received</dt><dd className="text-emerald-600">{money(doc.amount_paid)}</dd></div>
                        <div className="flex justify-between font-semibold"><dt>Balance</dt><dd>{money(doc.balance)}</dd></div>
                      </dl>
                    </Card>
                  )}
                  {data.notes?.length > 0 && (
                    <Card title="Credit & debit notes" padded={false}>
                      <Table rows={data.notes} onRowClick={(r) => nav(`/invoices/${r.id}`)} columns={[
                        { key: "number", label: "Number", render: (r) => (r.status === "draft" ? "Draft" : r.number) },
                        { key: "doc_type", label: "Type", render: (r) => DOC_LABELS[r.doc_type] },
                        { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                        { key: "total", label: "Amount", align: "right", render: (r) => money(r.total) },
                      ]} />
                    </Card>
                  )}
                  <HistoryCard key={historyKey} invoice={doc} />
                </div>
              )}
            </div>

            {modal === "payment" && <PaymentModal invoice={doc} onClose={() => setModal(null)} onSaved={reload} />}
            {modal === "email" && <EmailModal doc={doc} onClose={() => setModal(null)} onSent={reload} />}
            {modal === "cancel" && (
              <ReasonModal
                title={`Cancel ${doc.number}?`}
                intro={Number(doc.amount_paid) > 0 ? "This invoice has payments recorded. Remove them first, or raise a credit note instead." : "It stays on record marked as cancelled, and its number is not used again. Enter the reason."}
                disabled={Number(doc.amount_paid) > 0}
                submitLabel={`Cancel ${DOC_LABELS[docKind].toLowerCase()}`}
                danger
                busy={busy}
                onClose={() => setModal(null)}
                onSubmit={(reason) => act(() => api(`invoices/${id}/cancel`, { method: "POST", body: { reason } }), "Cancelled")}
              />
            )}
            {modal?.removePayment && (
              <ReasonModal
                title="Remove this payment?"
                intro={`${money(modal.removePayment.amount)} received on ${date(modal.removePayment.date)}. Enter why it is being removed (for example, the cheque bounced). This is kept in the history.`}
                submitLabel="Remove payment"
                danger
                busy={busy}
                onClose={() => setModal(null)}
                onSubmit={(reason) => act(() => api(`payments/${modal.removePayment.id}`, { method: "DELETE", body: { reason } }), "Payment removed")}
              />
            )}
            <Confirm
              open={modal === "issue"}
              onClose={() => setModal(null)}
              onConfirm={() => act(() => api(`invoices/${id}/issue`, { method: "POST" }), `${DOC_LABELS[docKind]} issued`)}
              busy={busy}
              title={`Issue this ${DOC_LABELS[docKind].toLowerCase()}?`}
              confirmLabel="Issue"
              variant="primary"
              message={`It gets the next number in sequence and the company and customer details are fixed on it. Total ${money(doc.total)}. After issuing it can be cancelled but never deleted, and any change needs a reason.`}
            />
            <Confirm open={modal === "delete"} onClose={() => setModal(null)} onConfirm={remove} busy={busy}
              message={isQuote ? `Delete ${doc.number}? This cannot be undone.` : "Delete this draft? It was never issued, so no number is lost."} />
          </>
        );
      }}
    </Async>
  );
}

/** On phones, share the PDF itself to WhatsApp; elsewhere open WhatsApp with a message (attach the downloaded PDF). */
async function shareWhatsApp(doc, pdfPath) {
  const c = doc.company;
  const name = doc.client.name || doc.client.company || "";
  const lines = [
    `Hello ${name},`,
    ``,
    `Please find ${docTitle(doc.doc_type, doc.supply_type).toLowerCase()} ${doc.number} for ${money(doc.total)}${doc.doc_type === "invoice" && doc.due_date ? `, due on ${date(doc.due_date)}` : ""}.`,
  ];
  if (doc.doc_type === "invoice" && Number(doc.balance) > 0) {
    if (c.upi_id) lines.push(`UPI: ${c.upi_id}`);
    if (c.bank_account_number) lines.push(`Bank: ${[c.bank_account_name, c.bank_name, `A/c ${c.bank_account_number}`, c.bank_ifsc && `IFSC ${c.bank_ifsc}`].filter(Boolean).join(", ")}`);
  }
  lines.push(``, `Thank you,`, c.company_name);
  const text = lines.join("\n");
  try {
    const res = await api(`${pdfPath}?download=1`, { raw: true });
    const file = new File([await res.blob()], fileName(doc), { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
  } catch (e) {
    if (e?.name === "AbortError") return;
  }
  const phone = (doc.client.phone || "").replace(/\D/g, "");
  window.open(`https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function EmailModal({ doc, onClose, onSent }) {
  const title = docTitle(doc.doc_type, doc.supply_type);
  const [f, set] = useForm({
    to: doc.client.email || "",
    subject: `${title} ${doc.number} from ${doc.company.company_name}`,
    message: [
      `Dear ${doc.client.name || doc.client.company || "Sir/Madam"},`,
      ``,
      `Please find attached ${title.toLowerCase()} ${doc.number} for ${money(doc.total)}${doc.doc_type === "invoice" && doc.due_date ? `, due on ${date(doc.due_date)}` : ""}.`,
      ``,
      `Thank you for your business.`,
      ``,
      `Regards,`,
      doc.company.company_name,
      [doc.company.company_phone, doc.company.company_email].filter(Boolean).join(" · "),
    ].join("\n"),
  });
  const [run, busy] = useAction();
  const send = () => run(async () => {
    await api(`invoices/${doc.id}/email`, { method: "POST", body: f });
    onSent();
    onClose();
  }, "Email sent with the PDF attached");
  return (
    <Modal open wide onClose={onClose} title={`Email ${doc.number}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Send} onClick={send} busy={busy}>Send</Button></>}>
      <Input label="To" value={f.to} onChange={set("to")} hint="Separate several addresses with commas." />
      <Input label="Subject" value={f.subject} onChange={set("subject")} />
      <Textarea label="Message" rows={9} value={f.message} onChange={set("message")} />
      <p className="text-xs text-slate-500">The PDF is attached. Replies go to {doc.company.company_email || "the company email"}.</p>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSaved }) {
  const [f, set] = useForm({ amount: Number(invoice.balance).toFixed(2), date: today(), method: "bank_transfer", reference: "", notes: "" });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    await api(`invoices/${invoice.id}/payments`, { method: "POST", body: f });
    onSaved();
    onClose();
  }, "Payment recorded");
  return (
    <Modal open onClose={onClose} title={`Record payment · ${invoice.number}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save payment</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Amount" type="number" min="0" step="any" value={f.amount} onChange={set("amount")} hint={`Balance due ${money(invoice.balance)}`} />
        <Input label="Date received" type="date" value={f.date} onChange={set("date")} />
        <Select label="Method" value={f.method} onChange={set("method")} options={PAYMENT_METHODS} />
        <Input label="Reference / UTR / cheque no." value={f.reference} onChange={set("reference")} />
      </div>
      <Input label="Notes" value={f.notes} onChange={set("notes")} />
    </Modal>
  );
}

const ACTION_LABELS = {
  created: "Created", issued: "Issued", edited: "Edited", cancelled: "Cancelled", payment_received: "Payment received",
  payment_removed: "Payment removed", emailed: "Emailed", company_details_updated: "Company details updated", draft_deleted: "Draft deleted",
};
const ACTION_TONES = { issued: "brand", edited: "amber", cancelled: "red", payment_received: "green", payment_removed: "red", company_details_updated: "amber" };

/** Read-only history: who did what, when, why, with old and new values and a PDF of each issued version. */
function HistoryCard({ invoice }) {
  const res = useApi(`invoices/${invoice.id}/history`);
  const [open, setOpen] = useState({});
  const toast = useToast();
  const exportAs = (format) => downloadFile(`invoices/${invoice.id}/history/export?format=${format}`, `history-${String(invoice.number).replace(/\//g, "-")}.${format}`).catch((e) => toast(e.message, "error"));
  return (
    <Card
      title={<span className="inline-flex items-center gap-1.5"><History className="h-4 w-4" /> History</span>}
      actions={
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => exportAs("csv")}>CSV</Button>
          <Button size="sm" variant="ghost" onClick={() => exportAs("xlsx")}>Excel</Button>
        </div>
      }
      padded={false}
    >
      <Async result={res}>
        {(d) => (
          <ol className="divide-y divide-slate-100">
            {d.items.map((h) => {
              const expanded = open[h.id] ?? h.changes.length <= 3;
              return (
                <li key={h.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={ACTION_TONES[h.action] || "slate"}>{ACTION_LABELS[h.action] || label(h.action)}</Badge>
                    <span className="text-slate-600">{h.user_name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{dateTime(h.created_at)}</span>
                  </div>
                  {h.reason && <p className="mt-1.5 text-slate-700"><span className="text-slate-400">Reason:</span> {h.reason}</p>}
                  {h.changes.length > 0 && (
                    <>
                      {h.changes.length > 3 && (
                        <button onClick={() => setOpen({ ...open, [h.id]: !expanded })} className="mt-1.5 flex items-center gap-1 text-xs text-brand-700">
                          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} {h.changes.length} changes
                        </button>
                      )}
                      {expanded && (
                        <table className="mt-1.5 w-full text-xs">
                          <tbody>
                            {h.changes.map((c, i) => (
                              <tr key={i} className="align-top">
                                <td className="py-0.5 pr-2 text-slate-500 whitespace-nowrap">{c.field}</td>
                                <td className="py-0.5 pr-1 text-red-700 line-through decoration-red-300 break-words">{c.old}</td>
                                <td className="py-0.5 text-emerald-700 break-words">{c.new}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                  {h.has_pdf && (
                    <button onClick={() => openFile(`invoice-history/${h.id}/pdf`)} className="mt-1.5 flex items-center gap-1 text-xs text-brand-700 hover:underline">
                      <FileText className="h-3 w-3" /> PDF of this version
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Async>
      <p className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100">History can't be edited or deleted.</p>
    </Card>
  );
}
