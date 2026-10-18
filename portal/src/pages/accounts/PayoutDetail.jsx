import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Trash2, Printer } from "lucide-react";
import { api } from "../../lib/api";
import { money, date, hours, label, today } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Confirm } from "../../components/ui";

export default function PayoutDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const res = useApi(`payouts/${id}`);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [run, busy] = useAction();

  const remove = () => run(async () => {
    await api(`payouts/${id}`, { method: "DELETE" });
    nav("/payouts");
  }, "Payout deleted; its hours and tasks are unpaid again");

  return (
    <Async result={res}>
      {({ payout, timesheets, tasks }) => (
        <>
          <Link to="/payouts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 no-print">
            <ArrowLeft className="h-4 w-4" /> Payouts
          </Link>
          <PageHeader
            title={`Payout #${payout.id} · ${payout.user_name}`}
            subtitle={`${date(payout.period_start)} – ${date(payout.period_end)}`}
            actions={
              <>
                <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
                {payout.status === "pending" && (
                  <>
                    <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>
                    <Button icon={CheckCircle2} onClick={() => setPaying(true)}>Mark as paid</Button>
                  </>
                )}
              </>
            }
          />
          <div className="grid lg:grid-cols-3 gap-6 print-area">
            <Card title="Summary">
              <dl className="text-sm space-y-2">
                <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><Badge status={payout.status} /></dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Hours</dt><dd>{hours(payout.hours)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Hours amount</dt><dd>{money(payout.hours_amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Fixed tasks</dt><dd>{money(payout.task_amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Adjustment</dt><dd>{money(payout.adjustments)}</dd></div>
                <div className="flex justify-between font-semibold border-t border-slate-200 pt-2"><dt>Total</dt><dd>{money(payout.total)}</dd></div>
                {payout.status === "paid" && (
                  <>
                    <div className="flex justify-between"><dt className="text-slate-500">Paid on</dt><dd>{date(payout.paid_date)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Method</dt><dd>{label(payout.payment_method)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Reference</dt><dd>{payout.reference || "—"}</dd></div>
                  </>
                )}
              </dl>
              {payout.notes && <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">{payout.notes}</p>}
            </Card>
            <div className="lg:col-span-2 space-y-6">
              <Card title="Hours" padded={false}>
                <Table rows={timesheets} empty="No hours in this payout." columns={[
                  { key: "date", label: "Date", render: (r) => date(r.date) },
                  { key: "project_name", label: "Project" },
                  { key: "description", label: "Work done" },
                  { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
                ]} />
              </Card>
              {tasks.length > 0 && (
                <Card title="Fixed-price tasks" padded={false}>
                  <Table rows={tasks} columns={[
                    { key: "title", label: "Task" },
                    { key: "project_name", label: "Project" },
                    { key: "fixed_amount", label: "Amount", align: "right", render: (r) => money(r.fixed_amount) },
                  ]} />
                </Card>
              )}
            </div>
          </div>
          {paying && <PayModal payout={payout} onClose={() => setPaying(false)} onSaved={res.reload} />}
          <Confirm open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} busy={busy} message="Delete this payout? Its hours and tasks become unpaid again so you can recalculate." />
        </>
      )}
    </Async>
  );
}

function PayModal({ payout, onClose, onSaved }) {
  const [f, set] = useForm({ paid_date: today(), payment_method: "bank_transfer", reference: "" });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    await api(`payouts/${payout.id}/pay`, { method: "POST", body: f });
    onSaved();
    onClose();
  }, "Marked paid; expense recorded");
  return (
    <Modal open onClose={onClose} title={`Pay ${money(payout.total)} to ${payout.user_name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Confirm payment</Button></>}>
      <p className="text-sm text-slate-500">This also records the amount as a "Freelancer Payouts" expense.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Paid on" type="date" value={f.paid_date} onChange={set("paid_date")} />
        <Select label="Method" value={f.payment_method} onChange={set("payment_method")} options={["bank_transfer", "upi", "cash", "cheque", "card", "other"].map((m) => [m, label(m)])} />
      </div>
      <Input label="Reference / UTR" value={f.reference} onChange={set("reference")} />
    </Modal>
  );
}
