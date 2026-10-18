import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { date, hours, monthStart, today } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea } from "../../components/ui";

export default function MyTimesheet() {
  const [range, setRange] = useState({ from: monthStart(), to: today() });
  const res = useApi(`timesheets?mine=1&from=${range.from}&to=${range.to}`);
  const [logging, setLogging] = useState(null);
  const [run] = useAction();

  const remove = (id) => run(async () => {
    await api(`timesheets/${id}`, { method: "DELETE" });
    res.reload();
  }, "Entry removed");

  return (
    <>
      <PageHeader
        title="My timesheet"
        subtitle="Log the hours you work on each project. Approved hours are what you get paid for."
        actions={<Button icon={Plus} onClick={() => setLogging({})}>Log time</Button>}
      />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
      </div>
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              empty="No time logged in this period."
              onRowClick={(r) => r.status === "pending" && setLogging(r)}
              columns={[
                { key: "date", label: "Date", render: (r) => date(r.date) },
                { key: "project_name", label: "Project" },
                { key: "task_title", label: "Task" },
                { key: "description", label: "Work done", className: "max-w-sm" },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
                { key: "x", label: "", render: (r) => r.status === "pending" && (
                  <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="text-slate-400 hover:text-red-600" aria-label="Delete entry"><Trash2 className="h-4 w-4" /></button>
                ) },
              ]}
              footer={
                <tr>
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Total</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{hours(d.total_hours)}</td>
                  <td />
                </tr>
              }
            />
          )}
        </Async>
      </Card>
      {logging && <LogTimeModal preset={logging} onClose={() => setLogging(null)} onSaved={res.reload} />}
    </>
  );
}

/** Log or edit a timesheet entry. preset: {project_id?, task_id?} or an existing entry. */
export function LogTimeModal({ preset, onClose, onSaved }) {
  const isEdit = !!preset.id;
  const projects = useApi("projects");
  const [f, set] = useForm({
    project_id: preset.project_id || "",
    task_id: preset.task_id || "",
    date: preset.date || today(),
    hours: preset.hours ?? "",
    description: preset.description || "",
  });
  const tasks = useApi(f.project_id ? `projects/${f.project_id}` : null);
  const [run, busy] = useAction();

  const save = () => run(async () => {
    const body = { ...f, task_id: f.task_id || null };
    await api(isEdit ? `timesheets/${preset.id}` : "timesheets", { method: isEdit ? "PUT" : "POST", body });
    onSaved();
    onClose();
  }, "Time logged");

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit time entry" : "Log time"} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Project *" value={f.project_id} onChange={(e) => { set("project_id")(e); set("task_id")(""); }} placeholder="Choose project"
          options={(projects.data?.items || []).filter((p) => !["completed", "cancelled"].includes(p.status) || String(p.id) === String(f.project_id)).map((p) => [p.id, p.name])} />
        <Select label="Task" value={f.task_id} onChange={set("task_id")} placeholder="General work" options={(tasks.data?.tasks || []).map((t) => [t.id, t.title])} />
        <Input label="Date" type="date" max={today()} value={f.date} onChange={set("date")} />
        <Input label="Hours *" type="number" min="0.25" max="24" step="0.25" value={f.hours} onChange={set("hours")} />
      </div>
      <Textarea label="What did you work on?" value={f.description} onChange={set("description")} />
    </Modal>
  );
}
