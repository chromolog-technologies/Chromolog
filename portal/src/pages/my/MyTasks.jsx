import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { date, hours, label, today } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Table, Badge, Tabs, Button } from "../../components/ui";
import { LogTimeModal } from "./MyTimesheet";

const STATUSES = ["todo", "in_progress", "review", "done"];

export default function MyTasks() {
  const nav = useNavigate();
  const [open, setOpen] = useState("1");
  const res = useApi(`tasks?mine=1${open ? "&open=1" : ""}`);
  const [logging, setLogging] = useState(null);
  const [run] = useAction();

  const move = (t, status) => run(async () => {
    await api(`tasks/${t.id}`, { method: "PUT", body: { status } });
    res.reload();
  }, `Moved to ${label(status).toLowerCase()}`);

  return (
    <>
      <PageHeader title="My tasks" subtitle="Tasks assigned to you across all projects." />
      <Tabs value={open} onChange={setOpen} tabs={[["1", "Open"], ["", "All"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              empty="No tasks assigned to you."
              columns={[
                { key: "title", label: "Task", render: (r) => <button className="font-medium text-slate-900 hover:text-brand-700 text-left" onClick={() => nav(`/projects/${r.project_id}`)}>{r.title}</button> },
                { key: "project_name", label: "Project" },
                { key: "priority", label: "Priority", render: (r) => <Badge status={r.priority} /> },
                { key: "due_date", label: "Due", render: (r) => <span className={r.due_date && r.due_date < today() && r.status !== "done" ? "text-red-600 font-medium" : ""}>{date(r.due_date)}</span> },
                { key: "hours_logged", label: "Logged", align: "right", render: (r) => hours(r.hours_logged) },
                { key: "status", label: "Status", render: (r) => (
                  <select value={r.status} onChange={(e) => move(r, e.target.value)} className="rounded-md text-xs ring-1 ring-slate-200 border-0 py-1 px-2" aria-label="Task status">
                    {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                ) },
                { key: "log", label: "", render: (r) => r.status !== "done" && (
                  <Button size="sm" variant="secondary" onClick={() => setLogging({ project_id: r.project_id, task_id: r.id })}>Log time</Button>
                ) },
              ]}
            />
          )}
        </Async>
      </Card>
      {logging && <LogTimeModal preset={logging} onClose={() => setLogging(null)} onSaved={res.reload} />}
    </>
  );
}
