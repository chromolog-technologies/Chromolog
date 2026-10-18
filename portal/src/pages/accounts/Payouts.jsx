import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calculator } from "lucide-react";
import { api } from "../../lib/api";
import { money, date, hours, monthStart, today } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea, Tabs, ErrorBox } from "../../components/ui";

export default function Payouts() {
  const nav = useNavigate();
  const [status, setStatus] = useState("");
  const res = useApi(`payouts${status ? `?status=${status}` : ""}`);
  const [creating, setCreating] = useState(false);
  return (
    <>
      <PageHeader
        title="Freelancer payouts"
        subtitle="Pay is calculated from approved timesheet hours × rate, plus fixed-price tasks marked done."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New payout</Button>}
      />
      <Tabs value={status} onChange={setStatus} tabs={[["", "All"], ["pending", "To pay"], ["paid", "Paid"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/payouts/${r.id}`)}
              empty="No payouts yet."
              columns={[
                { key: "user_name", label: "Person", render: (r) => <span className="font-medium text-slate-900">{r.user_name}</span> },
                { key: "period", label: "Period", render: (r) => `${date(r.period_start)} – ${date(r.period_end)}` },
                { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "paid_date", label: "Paid on", render: (r) => date(r.paid_date) },
                { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
              ]}
            />
          )}
        </Async>
      </Card>
      {creating && <NewPayout onClose={() => setCreating(false)} onCreated={(p) => nav(`/payouts/${p.id}`)} />}
    </>
  );
}

function NewPayout({ onClose, onCreated }) {
  const users = useApi("users/options");
  const [f, setF] = useState({ user_id: "", period_start: monthStart(), period_end: today(), adjustments: 0, notes: "" });
  const previewPath = f.user_id ? `payouts/preview?user_id=${f.user_id}&from=${f.period_start}&to=${f.period_end}` : null;
  const preview = useApi(previewPath);
  const [run, busy] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const create = () => run(async () => {
    const d = await api("payouts", { method: "POST", body: f });
    onCreated(d.payout);
  }, "Payout created");

  const p = preview.data;
  const total = p ? p.total + (Number(f.adjustments) || 0) : 0;

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="New payout"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Calculator} onClick={create} busy={busy} disabled={!p || total <= 0}>Create payout of {money(total)}</Button></>}
    >
      <div className="grid sm:grid-cols-3 gap-4">
        <Select label="Person" value={f.user_id} onChange={set("user_id")} placeholder="Choose person" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
        <Input label="From" type="date" value={f.period_start} onChange={set("period_start")} />
        <Input label="To" type="date" value={f.period_end} onChange={set("period_end")} />
      </div>
      {preview.error && <ErrorBox error={preview.error} />}
      {p && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">Approved, unpaid hours ({hours(p.hours)})</div>
            <Table rows={p.timesheets} empty="No approved unpaid hours in this period." columns={[
              { key: "date", label: "Date", render: (r) => date(r.date) },
              { key: "project_name", label: "Project" },
              { key: "task_title", label: "Task" },
              { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
              { key: "rate", label: "Rate", align: "right", render: (r) => money(r.rate) },
              { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
            ]} />
          </div>
          {p.tasks.length > 0 && (
            <div className="rounded-lg border border-slate-200">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">Fixed-price tasks completed</div>
              <Table rows={p.tasks} columns={[
                { key: "title", label: "Task" },
                { key: "project_name", label: "Project" },
                { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
              ]} />
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Adjustment (+ bonus / − deduction)" type="number" step="any" value={f.adjustments} onChange={set("adjustments")} />
            <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Hours</span><span>{money(p.hours_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fixed tasks</span><span>{money(p.task_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Adjustment</span><span>{money(Number(f.adjustments) || 0)}</span></div>
              <div className="flex justify-between font-semibold border-t border-slate-200 pt-1"><span>Total</span><span>{money(total)}</span></div>
            </div>
          </div>
          <Textarea label="Notes" value={f.notes} onChange={set("notes")} rows={2} />
        </div>
      )}
    </Modal>
  );
}
