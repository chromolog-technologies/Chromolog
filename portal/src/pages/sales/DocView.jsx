import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Pencil, Send, CheckCircle2, XCircle, Receipt, Trash2, Ban, HandCoins } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money, date, label, today } from "../../lib/format";
import { useApi, useAction, useForm, Async, Card, Badge, Button, Modal, Input, Select, Table, Confirm } from "../../components/ui";

export default function DocView({ kind }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, settings } = useAuth();
  const isQuote = kind === "quotation";
  const base = isQuote ? "quotations" : "invoices";
  const res = useApi(`${base}/${id}`);
  const [run, busy] = useAction();
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setStatus = (status) => run(async () => {
    const d = res.data[kind];
    if (isQuote) {
      await api(`${base}/${id}`, { method: "PUT", body: { ...d, status } });
    } else {
      await api(`${base}/${id}`, { method: "PUT", body: { status } });
    }
    res.reload();
  }, `Marked as ${label(status).toLowerCase()}`);

  const convert = () => run(async () => {
    const d = await api(`quotations/${id}/convert`, { method: "POST" });
    nav(`/invoices/${d.invoice.id}`);
  }, "Invoice created from quotation");

  const remove = () => run(async () => {
    await api(`${base}/${id}`, { method: "DELETE" });
    nav(`/${base}`);
  }, "Deleted");

  const deletePayment = (pid) => run(async () => {
    await api(`payments/${pid}`, { method: "DELETE" });
    res.reload();
  }, "Payment removed");

  return (
    <Async result={res}>
      {(data) => {
        const doc = data[kind];
        const payments = data.payments || [];
        const balance = doc.total - (doc.amount_paid || 0);
        const editable = isQuote ? doc.status !== "invoiced" : Number(doc.amount_paid) === 0 && doc.status !== "cancelled";
        return (
          <>
            <div className="no-print">
              <Link to={`/${base}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
                <ArrowLeft className="h-4 w-4" /> {isQuote ? "Quotations" : "Invoices"}
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <h1 className="text-xl font-semibold mr-2">{doc.number}</h1>
                <Badge status={doc.status} />
                <div className="flex flex-wrap gap-2 ml-auto">
                  <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
                  {editable && <Button variant="secondary" icon={Pencil} onClick={() => nav(`/${base}/${id}/edit`)}>Edit</Button>}
                  {isQuote && doc.status === "draft" && <Button variant="secondary" icon={Send} busy={busy} onClick={() => setStatus("sent")}>Mark sent</Button>}
                  {isQuote && ["draft", "sent"].includes(doc.status) && (
                    <>
                      <Button variant="secondary" icon={CheckCircle2} onClick={() => setStatus("accepted")}>Accepted</Button>
                      <Button variant="secondary" icon={XCircle} onClick={() => setStatus("rejected")}>Rejected</Button>
                    </>
                  )}
                  {isQuote && doc.status !== "invoiced" && can(user, "accounts") && <Button icon={Receipt} busy={busy} onClick={convert}>Convert to invoice</Button>}
                  {!isQuote && doc.status === "draft" && <Button variant="secondary" icon={Send} busy={busy} onClick={() => setStatus("sent")}>Mark sent</Button>}
                  {!isQuote && !["paid", "cancelled"].includes(doc.status) && <Button icon={HandCoins} onClick={() => setPaying(true)}>Record payment</Button>}
                  {!isQuote && Number(doc.amount_paid) === 0 && doc.status !== "cancelled" && <Button variant="ghost" icon={Ban} onClick={() => setStatus("cancelled")}>Cancel invoice</Button>}
                  {(isQuote ? can(user, "accounts") && doc.status !== "invoiced" : user.role === "admin" && Number(doc.amount_paid) === 0) && (
                    <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(true)} aria-label="Delete" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-6 items-start">
              <article className="print-area xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-10 text-sm text-slate-800">
                <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{settings.company_name}</div>
                    <div className="text-slate-500 whitespace-pre-line mt-1">{settings.company_address}</div>
                    <div className="text-slate-500 mt-1">{settings.company_email} · {settings.company_phone}</div>
                    {settings.tax_id && <div className="text-slate-500">{settings.tax_label || "Tax"} ID: {settings.tax_id}</div>}
                  </div>
                  <div className="sm:text-right">
                    <div className="text-2xl font-light tracking-wide text-brand-700 uppercase">{isQuote ? "Quotation" : "Invoice"}</div>
                    <div className="font-semibold mt-1">{doc.number}</div>
                    <div className="text-slate-500 mt-1">Date: {date(doc.issue_date)}</div>
                    {isQuote ? <div className="text-slate-500">Valid until: {date(doc.valid_until)}</div> : <div className="text-slate-500">Due: {date(doc.due_date)}</div>}
                  </div>
                </header>

                <section className="py-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{isQuote ? "Prepared for" : "Bill to"}</div>
                  <div className="font-semibold">{doc.client_company || doc.client_name}</div>
                  {doc.client_company && <div>{doc.client_name}</div>}
                  {doc.client_address && <div className="text-slate-500 whitespace-pre-line">{doc.client_address}</div>}
                  <div className="text-slate-500">{[doc.client_email, doc.client_phone].filter(Boolean).join(" · ")}</div>
                  {doc.client_tax_id && <div className="text-slate-500">Tax ID: {doc.client_tax_id}</div>}
                  {doc.title && <div className="mt-3 font-medium">Re: {doc.title}</div>}
                </section>

                <table className="w-full">
                  <thead>
                    <tr className="border-y border-slate-200 text-xs text-slate-500">
                      <th className="text-left py-2 font-semibold">Description</th>
                      <th className="text-right py-2 font-semibold w-16">Qty</th>
                      <th className="text-right py-2 font-semibold w-28">Rate</th>
                      <th className="text-right py-2 font-semibold w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((it, i) => (
                      <tr key={i} className="border-b border-slate-100 align-top">
                        <td className="py-2.5 pr-4 whitespace-pre-line">{it.description}</td>
                        <td className="py-2.5 text-right tabular-nums">{Number(it.quantity)}</td>
                        <td className="py-2.5 text-right tabular-nums">{money(it.unit_price)}</td>
                        <td className="py-2.5 text-right tabular-nums">{money(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <dl className="ml-auto mt-4 w-full sm:w-72 space-y-1.5">
                  <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular-nums">{money(doc.subtotal)}</dd></div>
                  {Number(doc.discount) > 0 && <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="tabular-nums">−{money(doc.discount)}</dd></div>}
                  {Number(doc.tax_rate) > 0 && (
                    <div className="flex justify-between"><dt className="text-slate-500">{settings.tax_label} ({Number(doc.tax_rate)}%)</dt><dd className="tabular-nums">{money(doc.total - (doc.subtotal - doc.discount))}</dd></div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(doc.total)}</dd></div>
                  {!isQuote && Number(doc.amount_paid) > 0 && (
                    <>
                      <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="tabular-nums">{money(doc.amount_paid)}</dd></div>
                      <div className="flex justify-between font-semibold"><dt>Balance due</dt><dd className="tabular-nums">{money(balance)}</dd></div>
                    </>
                  )}
                </dl>

                {(doc.notes || doc.terms || (!isQuote && settings.bank_details)) && (
                  <footer className="mt-8 pt-6 border-t border-slate-200 grid sm:grid-cols-2 gap-6 text-xs text-slate-600">
                    {!isQuote && settings.bank_details && (
                      <div>
                        <div className="font-semibold text-slate-800 mb-1">Payment details</div>
                        <p className="whitespace-pre-line">{settings.bank_details}</p>
                      </div>
                    )}
                    {(doc.notes || doc.terms) && (
                      <div>
                        {doc.notes && <p className="whitespace-pre-line mb-2">{doc.notes}</p>}
                        {doc.terms && <p className="whitespace-pre-line text-slate-500">{doc.terms}</p>}
                      </div>
                    )}
                  </footer>
                )}
              </article>

              {!isQuote && (
                <div className="no-print space-y-6">
                  <Card title="Payments received" padded={false}>
                    <Table
                      rows={payments}
                      empty="No payments yet."
                      columns={[
                        { key: "date", label: "Date", render: (r) => date(r.date) },
                        { key: "method", label: "Method", render: (r) => label(r.method) },
                        { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
                        { key: "x", label: "", render: (r) => (
                          <button onClick={() => deletePayment(r.id)} className="text-slate-400 hover:text-red-600" aria-label="Remove payment"><Trash2 className="h-4 w-4" /></button>
                        ) },
                      ]}
                    />
                  </Card>
                  <Card>
                    <dl className="text-sm space-y-2">
                      <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd>{money(doc.total)}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="text-emerald-600">{money(doc.amount_paid)}</dd></div>
                      <div className="flex justify-between font-semibold"><dt>Balance</dt><dd>{money(balance)}</dd></div>
                    </dl>
                  </Card>
                </div>
              )}
            </div>

            {paying && <PaymentModal invoice={doc} balance={balance} onClose={() => setPaying(false)} onSaved={res.reload} />}
            <Confirm open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} busy={busy} message={`Delete ${doc.number}? This cannot be undone.`} />
          </>
        );
      }}
    </Async>
  );
}

function PaymentModal({ invoice, balance, onClose, onSaved }) {
  const [f, set] = useForm({ amount: balance.toFixed(2), date: today(), method: "bank_transfer", reference: "", notes: "" });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    await api(`invoices/${invoice.id}/payments`, { method: "POST", body: f });
    onSaved();
    onClose();
  }, "Payment recorded");
  return (
    <Modal open onClose={onClose} title={`Record payment · ${invoice.number}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save payment</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Amount" type="number" min="0" step="any" value={f.amount} onChange={set("amount")} hint={`Balance due ${money(balance)}`} />
        <Input label="Date received" type="date" value={f.date} onChange={set("date")} />
        <Select label="Method" value={f.method} onChange={set("method")} options={["bank_transfer", "upi", "cash", "cheque", "card", "other"].map((m) => [m, label(m)])} />
        <Input label="Reference / UTR" value={f.reference} onChange={set("reference")} />
      </div>
      <Input label="Notes" value={f.notes} onChange={set("notes")} />
    </Modal>
  );
}
