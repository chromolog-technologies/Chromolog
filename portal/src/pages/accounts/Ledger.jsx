import { useState } from "react";
import { Plus, Paperclip } from "lucide-react";
import { api, openFile } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, date, label, today, monthStart } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Button, Modal, Input, Select, Textarea, Field, Confirm } from "../../components/ui";

const METHODS = ["bank_transfer", "upi", "cash", "cheque", "card", "other"];

/** Expenses (bills paid) or other income. kind: "expenses" | "income". */
export default function Ledger({ kind }) {
  const { settings } = useAuth();
  const isExpense = kind === "expenses";
  const party = isExpense ? "vendor" : "source";
  const categories = isExpense ? settings.expense_categories : settings.income_categories;
  const [filters, setFilters] = useState({ from: monthStart(), to: today(), category: "" });
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  const res = useApi(`${kind}?${qs}`);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader
        title={isExpense ? "Expenses & bills" : "Other income"}
        subtitle={isExpense ? "Every bill the company pays, with the receipt attached." : "Income that isn't an invoice payment (advances, interest, refunds…). Invoice payments are counted automatically."}
        actions={<Button icon={Plus} onClick={() => setEditing({})}>{isExpense ? "Add expense" : "Add income"}</Button>}
      />
      <Card padded={false}>
        <div className="flex flex-wrap items-end gap-3 p-3 border-b border-slate-100">
          <Input label="From" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <Input label="To" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <Select label="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="All categories" options={categories} />
        </div>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => setEditing(r)}
              empty={`No ${isExpense ? "expenses" : "income"} in this period.`}
              columns={[
                { key: "date", label: "Date", render: (r) => date(r.date) },
                { key: "category", label: "Category" },
                { key: party, label: isExpense ? "Vendor / paid to" : "Received from" },
                { key: "description", label: "Description", className: "max-w-xs truncate" },
                ...(isExpense ? [{ key: "project_name", label: "Project" }] : []),
                { key: "payment_method", label: "Method", render: (r) => label(r.payment_method) },
                { key: "file", label: "Bill", render: (r) => (r.file_name ? (
                  <button onClick={(e) => { e.stopPropagation(); openFile(`${kind}/${r.id}/file`); }} className="text-brand-600 inline-flex items-center gap-1" aria-label="Open attachment">
                    <Paperclip className="h-4 w-4" />
                  </button>
                ) : "—") },
                { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
              ]}
              footer={
                <tr>
                  <td colSpan={isExpense ? 7 : 6} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Total</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(d.total)}</td>
                </tr>
              }
            />
          )}
        </Async>
      </Card>
      {editing && <EntryForm kind={kind} entry={editing} categories={categories} onClose={() => setEditing(null)} onSaved={res.reload} />}
    </>
  );
}

function EntryForm({ kind, entry, categories, onClose, onSaved }) {
  const isExpense = kind === "expenses";
  const party = isExpense ? "vendor" : "source";
  const isNew = !entry.id;
  const locked = !!entry.payout_id;
  const projects = useApi(isExpense ? "projects" : null);
  const [f, set] = useForm({
    date: entry.date || today(),
    category: entry.category || categories[0] || "",
    [party]: entry[party] || "",
    description: entry.description || "",
    amount: entry.amount ?? "",
    payment_method: entry.payment_method || "bank_transfer",
    reference: entry.reference || "",
    project_id: entry.project_id || "",
  });
  const [file, setFile] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [run, busy] = useAction();

  const save = () => run(async () => {
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => {
      if (k === "project_id" && !isExpense) return;
      fd.append(k, v ?? "");
    });
    if (file) fd.append("file", file);
    await api(isNew ? kind : `${kind}/${entry.id}`, { method: isNew ? "POST" : "PUT", body: fd });
    onSaved();
    onClose();
  }, "Saved");

  const remove = () => run(async () => {
    await api(`${kind}/${entry.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }, "Deleted");

  const categoryOptions = categories.includes(f.category) || !f.category ? categories : [f.category, ...categories];

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? (isExpense ? "Add expense" : "Add income") : isExpense ? "Expense" : "Income"}
      footer={
        <>
          {!isNew && !locked && <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirm(true)}>Delete</Button>}
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {!locked && <Button onClick={save} busy={busy}>Save</Button>}
        </>
      }
    >
      {locked && <p className="text-sm rounded-lg bg-amber-50 text-amber-800 p-3">Created automatically from a freelancer payout. Edit the payout instead.</p>}
      <fieldset disabled={locked} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Date" type="date" value={f.date} onChange={set("date")} />
          <Input label="Amount *" type="number" min="0" step="any" value={f.amount} onChange={set("amount")} />
          <Select label="Category" value={f.category} onChange={set("category")} options={categoryOptions} />
          <Input label={isExpense ? "Vendor / paid to" : "Received from"} value={f[party]} onChange={set(party)} />
          <Select label="Payment method" value={f.payment_method} onChange={set("payment_method")} options={METHODS.map((m) => [m, label(m)])} />
          <Input label="Reference / bill no." value={f.reference} onChange={set("reference")} />
          {isExpense && (
            <Select label="Project (optional)" value={f.project_id} onChange={set("project_id")} placeholder="—" options={(projects.data?.items || []).map((p) => [p.id, p.name])} className="sm:col-span-2" />
          )}
        </div>
        <Textarea label="Description" value={f.description} onChange={set("description")} rows={2} />
        <Field label={isExpense ? "Bill / receipt (PDF or photo)" : "Proof (optional)"} hint={entry.file_name ? `Current: ${entry.file_name} — choose a file to replace it` : "PDF, JPG, PNG, WEBP, Word or Excel, max 10 MB"}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xlsx" onChange={(e) => setFile(e.target.files[0] || null)} className="block text-sm text-slate-600" />
        </Field>
      </fieldset>
      {entry.file_name && (
        <Button variant="secondary" size="sm" icon={Paperclip} onClick={() => run(() => openFile(`${kind}/${entry.id}/file`))}>Open {entry.file_name}</Button>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={busy} message="Delete this entry and its attachment?" />
    </Modal>
  );
}
