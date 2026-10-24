import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Send, Save } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { today, addDays, date, money } from "../../lib/format";
import { DOC_LABELS, SUPPLY_LABELS, calcLines, defaultSupply, stateName, taxEnabled } from "../../lib/gst";
import { useApi, useAction, Loading, ErrorBox, PageHeader, Card, Button, Input, Select, Textarea, Modal, Confirm } from "../../components/ui";
import LineItems, { blankLine } from "../../components/LineItems";

/**
 * Create/edit a quotation, invoice, or credit/debit note.
 * kind: "quotation" | "invoice". Notes: /invoices/new?note=credit_note&of=<invoice id>.
 */
export default function DocEditor({ kind }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, settings } = useAuth();
  const isQuote = kind === "quotation";
  const base = isQuote ? "quotations" : "invoices";
  const noteType = !id && ["credit_note", "debit_note"].includes(params.get("note")) ? params.get("note") : null;
  const tax = taxEnabled(settings);
  const defaultGst = tax ? Number(settings.default_gst_rate || 0) : 0;

  const clients = useApi("clients");
  const leads = useApi(isQuote ? "leads" : null);
  const projects = useApi(isQuote ? null : "projects");
  const services = useApi("services?active=1");
  const existing = useApi(id ? `${base}/${id}` : null);
  const original = useApi(noteType ? `invoices/${params.get("of")}` : null);
  const [doc, setDoc] = useState(null);
  const [run, busy] = useAction();
  const [askReason, setAskReason] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);

  useEffect(() => {
    if (id) {
      const d = existing.data?.[kind];
      if (!d) return;
      const items = d.items.length ? d.items.map((it) => ({ ...it, discount: it.discount || "" })) : [blankLine(defaultGst)];
      // Older documents had one discount for the whole document; show it on the first line.
      if (Number(d.discount) > 0 && !items.some((it) => Number(it.discount) > 0)) items[0] = { ...items[0], discount: d.discount };
      setDoc({ ...d, items, client_id: d.client_id || "", lead_id: d.lead_id || "", project_id: d.project_id || "", reverse_charge: !!d.reverse_charge });
      return;
    }
    if (noteType) {
      const o = original.data?.invoice;
      if (!o) return;
      setDoc({
        doc_type: noteType, original_invoice_id: o.id, client_id: o.client_id, issue_date: today(),
        place_of_supply: o.place_of_supply, supply_type: o.supply_type, reverse_charge: !!o.reverse_charge,
        note_reason: "", notes: "", terms: "",
        items: [{ ...blankLine(o.items[0]?.gst_rate ?? defaultGst), hsn_sac: o.items[0]?.hsn_sac || "" }],
      });
      return;
    }
    const issue = today();
    const pos = settings?.company_state || "32";
    setDoc({
      client_id: params.get("client_id") || "",
      lead_id: params.get("lead_id") || "",
      project_id: params.get("project_id") || "",
      title: "",
      issue_date: issue,
      valid_until: addDays(issue, 30),
      due_date: addDays(issue, Number(settings?.payment_terms_days || 15)),
      po_number: "",
      place_of_supply: pos,
      supply_type: defaultSupply(settings, pos),
      reverse_charge: false,
      notes: "",
      terms: isQuote ? settings?.quotation_terms : settings?.invoice_terms,
      items: [blankLine(defaultGst)],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, existing.data, original.data, kind, noteType, settings]);

  // A customer chosen from the URL (?client_id=) sets the place of supply once the list loads.
  const clientList = clients.data?.items || [];
  const client = clientList.find((c) => String(c.id) === String(doc?.client_id));

  if (id && existing.error) return <ErrorBox error={existing.error} />;
  if (noteType && original.error) return <ErrorBox error={original.error} />;
  if (!doc) return <Loading />;

  const docType = isQuote ? "quotation" : doc.doc_type || noteType || "invoice";
  const isNote = docType === "credit_note" || docType === "debit_note";
  const issued = !isQuote && id && doc.status !== "draft";
  const calc = calcLines(doc.items, tax ? doc.supply_type : "non_gst", doc.reverse_charge);
  const set = (k) => (e) => setDoc({ ...doc, [k]: e.target.value });

  const setPlace = (pos) => setDoc({ ...doc, place_of_supply: pos, supply_type: doc.supply_type === "exempt" ? "exempt" : defaultSupply(settings, pos) });
  const setClient = (clientId) => {
    const c = clientList.find((x) => String(x.id) === String(clientId));
    const pos = c?.state_code || settings.company_state;
    setDoc({ ...doc, client_id: clientId, lead_id: clientId ? "" : doc.lead_id, place_of_supply: pos, supply_type: doc.supply_type === "exempt" ? "exempt" : defaultSupply(settings, pos) });
  };

  const save = ({ issue = false, reason = null } = {}) =>
    run(async () => {
      const body = {
        ...doc,
        doc_type: docType === "quotation" ? undefined : docType,
        client_id: doc.client_id || null,
        lead_id: doc.lead_id || null,
        project_id: doc.project_id || null,
        items: doc.items.filter((it) => it.description.trim()),
        issue: issue || undefined,
        reason: reason || undefined,
      };
      const d = await api(id ? `${base}/${id}` : base, { method: id ? "PUT" : "POST", body });
      let saved = d[kind] || d.invoice;
      if (issue && id) saved = (await api(`invoices/${id}/issue`, { method: "POST" })).invoice;
      nav(`/${base}/${saved.id}`, { replace: true });
    }, issue ? `${DOC_LABELS[docType]} issued` : `${DOC_LABELS[docType]} saved`);

  const title = id
    ? `Edit ${doc.status === "draft" && !isQuote ? `draft ${DOC_LABELS[docType].toLowerCase()}` : doc.number}`
    : isNote ? `New ${DOC_LABELS[docType].toLowerCase()}` : isQuote ? "New quotation" : "New invoice";

  return (
    <>
      <PageHeader
        title={title}
        subtitle={issued ? "This has been issued. Your changes and the reason are kept in its history." : isNote ? `Against invoice ${original.data?.invoice.number || doc.original?.number || ""}` : undefined}
        actions={
          <>
            <Button variant="secondary" onClick={() => nav(-1)}>Cancel</Button>
            {issued ? (
              <Button icon={Save} onClick={() => setAskReason(true)} busy={busy}>Save changes</Button>
            ) : (
              <>
                <Button variant={isQuote ? "primary" : "secondary"} icon={Save} onClick={() => save()} busy={busy}>{isQuote ? "Save" : "Save draft"}</Button>
                {!isQuote && <Button icon={Send} onClick={() => setConfirmIssue(true)} busy={busy}>Save &amp; issue</Button>}
              </>
            )}
          </>
        }
      />
      <div className="space-y-6">
        <Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isNote ? (
              <Field label="Customer" value={client ? client.company || client.name : "—"} />
            ) : (
              <Select
                label={isQuote ? "Customer" : "Customer *"}
                value={doc.client_id || ""}
                onChange={(e) => setClient(e.target.value)}
                placeholder={isQuote ? "— or choose a lead —" : "Choose customer"}
                options={clientList.map((c) => [c.id, c.company || c.name])}
              />
            )}
            {isQuote && (
              <Select label="Lead" value={doc.lead_id || ""} disabled={!!doc.client_id} onChange={set("lead_id")} placeholder="—"
                options={(leads.data?.items || []).map((l) => [l.id, `${l.full_name}${l.company ? ` (${l.company})` : ""}`])} />
            )}
            {!isQuote && !isNote && (
              <Select label="Project (optional)" value={doc.project_id || ""} onChange={set("project_id")} placeholder="—" options={(projects.data?.items || []).map((p) => [p.id, p.name])} />
            )}
            {isQuote && <Input label="Title" value={doc.title || ""} onChange={set("title")} placeholder="e.g. Clinic token system" />}
            <Input label="Date" type="date" value={doc.issue_date} onChange={set("issue_date")} />
            {isQuote && <Input label="Valid until" type="date" value={doc.valid_until || ""} onChange={set("valid_until")} />}
            {docType === "invoice" && <Input label="Due date" type="date" value={doc.due_date || ""} onChange={set("due_date")} />}
            {docType === "invoice" && <Input label="PO / work order no." value={doc.po_number || ""} onChange={set("po_number")} placeholder="If the customer gave one" />}
          </div>

          {client && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
              <span><span className="text-slate-400">Bill to:</span> {client.company || client.name}{client.company ? ` (${client.name})` : ""}</span>
              {client.address && <span className="whitespace-pre-line"><span className="text-slate-400">Address:</span> {client.address}</span>}
              <span><span className="text-slate-400">GSTIN:</span> {client.tax_id || "— (unregistered)"}</span>
              <span><span className="text-slate-400">State:</span> {stateName(settings, client.state_code) || <span className="text-amber-700">not set</span>}</span>
              {[client.email, client.phone].filter(Boolean).length > 0 && <span>{[client.email, client.phone].filter(Boolean).join(" · ")}</span>}
              <Link to={`/clients/${client.id}`} className="text-brand-700 hover:underline ml-auto">Edit customer</Link>
            </div>
          )}

          {tax ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <Select label="Place of supply" value={doc.place_of_supply || ""} onChange={(e) => setPlace(e.target.value)} options={(settings.gst_states || []).map(([c, n]) => [c, `${n}${c !== "96" ? ` (${c})` : ""}`])} />
              <Select label="Tax type" value={doc.supply_type} onChange={set("supply_type")} options={["intra", "inter", "exempt"].map((t) => [t, SUPPLY_LABELS[t]])}
                hint={doc.supply_type !== "exempt" && doc.supply_type !== defaultSupply(settings, doc.place_of_supply) ? "Doesn't match the place of supply — check this." : undefined} />
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:mt-6">
                <input type="checkbox" checked={!!doc.reverse_charge} disabled={doc.supply_type === "exempt"} onChange={(e) => setDoc({ ...doc, reverse_charge: e.target.checked })} className="rounded border-slate-300" />
                Reverse charge applies
              </label>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">GST is switched off (not registered), so no tax is added. An admin can switch it on in Company settings.</p>
          )}

          {isNote && (
            <Textarea className="mt-4" label={`Reason for this ${DOC_LABELS[docType].toLowerCase()} *`} rows={2} value={doc.note_reason || ""} onChange={set("note_reason")}
              placeholder={docType === "credit_note" ? "e.g. Discount agreed after invoicing, or part of the work removed" : "e.g. Additional work billed after the invoice"} />
          )}
        </Card>

        <Card title="Line items" padded={false}>
          <LineItems
            items={doc.items}
            onChange={(items) => setDoc({ ...doc, items })}
            services={services.data?.items || []}
            supplyType={tax ? doc.supply_type : "non_gst"}
            reverseCharge={doc.reverse_charge}
            defaultGst={defaultGst}
          />
        </Card>

        <Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Textarea label="Notes (shown on the document)" value={doc.notes || ""} onChange={set("notes")} />
            <Textarea label="Terms" value={doc.terms || ""} onChange={set("terms")} />
          </div>
        </Card>
      </div>

      {askReason && (
        <ReasonModal
          title={`Save changes to ${doc.number}`}
          intro={user.role === "admin" ? "This invoice has been issued. Enter why it is being changed. The old and new values are kept in its history." : "Only an admin can change an issued invoice. Ask an admin, or raise a credit or debit note instead."}
          disabled={user.role !== "admin"}
          busy={busy}
          onClose={() => setAskReason(false)}
          onSubmit={(reason) => save({ reason })}
        />
      )}
      <Confirm
        open={confirmIssue}
        onClose={() => setConfirmIssue(false)}
        onConfirm={() => { setConfirmIssue(false); save({ issue: true }); }}
        busy={busy}
        title={`Issue this ${DOC_LABELS[docType].toLowerCase()}?`}
        confirmLabel="Issue"
        variant="primary"
        message={`It gets the next number in sequence and the company and customer details are fixed on it. Total ${money(calc.total)}, dated ${date(doc.issue_date)}. After issuing it can be cancelled but never deleted, and any change needs a reason.`}
      />
    </>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <div className="py-2 text-sm text-slate-800">{value}</div>
    </div>
  );
}

/** Popup asking for the reason for a change (required before Submit). */
export function ReasonModal({ title, intro, onSubmit, onClose, busy, disabled, submitLabel = "Submit", danger }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button variant={danger ? "danger" : "primary"} busy={busy} disabled={disabled || !reason.trim()} onClick={() => onSubmit(reason.trim())}>{submitLabel}</Button>
        </>
      }
    >
      {intro && <p className="text-sm text-slate-600">{intro}</p>}
      {!disabled && <Textarea label="Reason *" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
    </Modal>
  );
}
