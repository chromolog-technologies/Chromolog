import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, today, addDays } from "../../lib/format";
import { useApi, useAction, Loading, ErrorBox, PageHeader, Card, Button, Input, Select, Textarea } from "../../components/ui";

const blankLine = () => ({ description: "", quantity: 1, unit_price: "" });


/** Create/edit a quotation or invoice. kind: "quotation" | "invoice". */
export default function DocEditor({ kind }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { settings } = useAuth();
  const isQuote = kind === "quotation";
  const base = isQuote ? "quotations" : "invoices";

  const clients = useApi("clients");
  const leads = useApi(isQuote ? "leads" : null);
  const projects = useApi(isQuote ? null : "projects");
  const existing = useApi(id ? `${base}/${id}` : null);
  const [doc, setDoc] = useState(null);
  const [run, busy] = useAction();

  useEffect(() => {
    if (id) {
      const d = existing.data?.[kind];
      if (d) setDoc({ ...d, items: d.items.length ? d.items : [blankLine()] });
      return;
    }
    const issue = today();
    setDoc({
      client_id: params.get("client_id") || "",
      lead_id: params.get("lead_id") || "",
      project_id: params.get("project_id") || "",
      title: "",
      issue_date: issue,
      valid_until: addDays(issue, 30),
      due_date: addDays(issue, Number(settings?.payment_terms_days || 15)),
      discount: 0,
      tax_rate: 0,
      notes: "",
      terms: isQuote ? settings?.quotation_terms : settings?.invoice_terms,
      items: [blankLine()],
    });
  }, [id, existing.data, kind, isQuote, params, settings]);

  const totals = useMemo(() => {
    if (!doc) return { subtotal: 0, total: 0 };
    const subtotal = doc.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
    const discount = Math.min(Number(doc.discount) || 0, subtotal);
    const tax = settings?.tax_enabled === "1" ? Number(doc.tax_rate) || 0 : 0;
    return { subtotal, discount, tax, total: (subtotal - discount) * (1 + tax / 100) };
  }, [doc, settings]);

  if (id && existing.error) return <ErrorBox error={existing.error} />;
  if (!doc) return <Loading />;

  const set = (k) => (e) => setDoc({ ...doc, [k]: e.target.value });
  const setLine = (i, k, v) => setDoc({ ...doc, items: doc.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });

  const save = () =>
    run(async () => {
      const body = {
        ...doc,
        client_id: doc.client_id || null,
        lead_id: doc.lead_id || null,
        project_id: doc.project_id || null,
        items: doc.items.filter((it) => it.description.trim()),
      };
      const d = await api(id ? `${base}/${id}` : base, { method: id ? "PUT" : "POST", body });
      nav(`/${base}/${d[kind].id}`, { replace: true });
    }, isQuote ? "Quotation saved" : "Invoice saved");

  return (
    <>
      <PageHeader
        title={id ? `Edit ${doc.number}` : isQuote ? "New quotation" : "New invoice"}
        actions={
          <>
            <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
            <Button onClick={save} busy={busy}>Save</Button>
          </>
        }
      />
      <div className="space-y-6">
        <Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label={isQuote ? "Client" : "Client *"}
              value={doc.client_id || ""}
              onChange={(e) => setDoc({ ...doc, client_id: e.target.value, lead_id: e.target.value ? "" : doc.lead_id })}
              placeholder={isQuote ? "— or choose a lead —" : "Choose client"}
              options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])}
            />
            {isQuote && (
              <Select
                label="Lead"
                value={doc.lead_id || ""}
                disabled={!!doc.client_id}
                onChange={set("lead_id")}
                placeholder="—"
                options={(leads.data?.items || []).map((l) => [l.id, `${l.full_name}${l.company ? ` (${l.company})` : ""}`])}
              />
            )}
            {!isQuote && (
              <Select label="Project (optional)" value={doc.project_id || ""} onChange={set("project_id")} placeholder="—" options={(projects.data?.items || []).map((p) => [p.id, p.name])} />
            )}
            {isQuote && <Input label="Title" value={doc.title || ""} onChange={set("title")} placeholder="e.g. Clinic token system" />}
            <Input label="Date" type="date" value={doc.issue_date} onChange={set("issue_date")} />
            {isQuote ? (
              <Input label="Valid until" type="date" value={doc.valid_until || ""} onChange={set("valid_until")} />
            ) : (
              <Input label="Due date" type="date" value={doc.due_date || ""} onChange={set("due_date")} />
            )}
          </div>
        </Card>

        <Card title="Line items" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left px-4 py-2 font-semibold">Description</th>
                  <th className="text-right px-2 py-2 font-semibold w-24">Qty</th>
                  <th className="text-right px-2 py-2 font-semibold w-36">Rate</th>
                  <th className="text-right px-4 py-2 font-semibold w-36">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doc.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">
                      <textarea rows={1} value={it.description} onChange={(e) => setLine(i, "description", e.target.value)} placeholder="Item or service"
                        className="w-full rounded-md border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm py-1.5 px-2 resize-y" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="any" value={it.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)}
                        className="w-full text-right rounded-md border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm py-1.5 px-2" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="any" value={it.unit_price} onChange={(e) => setLine(i, "unit_price", e.target.value)}
                        className="w-full text-right rounded-md border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm py-1.5 px-2" />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</td>
                    <td className="pr-3">
                      {doc.items.length > 1 && (
                        <button onClick={() => setDoc({ ...doc, items: doc.items.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-red-600" aria-label="Remove line">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-t border-slate-100">
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setDoc({ ...doc, items: [...doc.items, blankLine()] })}>Add line</Button>
            <dl className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">Discount</dt>
                <dd><input type="number" min="0" step="any" value={doc.discount} onChange={set("discount")} className="w-32 text-right rounded-md border-0 ring-1 ring-slate-200 text-sm py-1 px-2" /></dd>
              </div>
              {settings?.tax_enabled === "1" && (
                <div className="flex justify-between items-center gap-3">
                  <dt className="text-slate-500">{settings.tax_label} %</dt>
                  <dd><input type="number" min="0" step="any" value={doc.tax_rate} onChange={set("tax_rate")} className="w-32 text-right rounded-md border-0 ring-1 ring-slate-200 text-sm py-1 px-2" /></dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-base"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
            </dl>
          </div>
        </Card>

        <Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Textarea label="Notes (shown on the document)" value={doc.notes || ""} onChange={set("notes")} />
            <Textarea label="Terms" value={doc.terms || ""} onChange={set("terms")} />
          </div>
        </Card>
      </div>
    </>
  );
}
