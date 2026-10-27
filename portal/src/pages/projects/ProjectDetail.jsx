import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Users, Trash2, Timer, Receipt, Lock } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money, date, hours, label, today } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Stat, Table, Badge, Button, Modal, Input, Select, Textarea, Tabs, Confirm } from "../../components/ui";
import { ProjectForm } from "./Projects";
import { LogTimeModal } from "../my/MyTimesheet";

const TASK_STATUSES = ["todo", "in_progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const res = useApi(`projects/${id}`);
  const timesheets = useApi(`timesheets?project_id=${id}`);
  const manager = can(user, "project");
  const [tab, setTab] = useState("board");
  const [editing, setEditing] = useState(false);
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState(false);
  const [logging, setLogging] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [run, busy] = useAction();

  const moveTask = (t, status) => run(async () => {
    await api(`tasks/${t.id}`, { method: "PUT", body: { status } });
    res.reload();
  });

  const remove = () => run(async () => {
    await api(`projects/${id}`, { method: "DELETE" });
    nav("/projects");
  }, "Project deleted");

  return (
    <Async result={res}>
      {({ project, members: team, tasks, cost }) => (
        <>
          <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="h-4 w-4" /> Projects
          </Link>
          <PageHeader
            title={project.name}
            subtitle={[project.client, project.deadline ? `Deadline ${date(project.deadline)}` : null].filter(Boolean).join(" · ")}
            actions={
              <>
                <Button variant="secondary" icon={Timer} onClick={() => setLogging({ project_id: project.id })}>Log time</Button>
                {manager && (
                  <>
                    <Button variant="secondary" icon={Users} onClick={() => setMembers(true)}>Team & rates</Button>
                    <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
                    {can(user, "accounts") && <Button variant="secondary" icon={Receipt} onClick={() => nav(`/invoices/new?client_id=${project.client_id || ""}&project_id=${project.id}`)}>Invoice</Button>}
                    <Button icon={Plus} onClick={() => setTask({ project_id: project.id })}>Add task</Button>
                  </>
                )}
                {user.role === "admin" && <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(true)} aria-label="Delete project" />}
              </>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat label="Status" value={<Badge status={project.status} />} />
            <Stat label="Tasks done" value={`${project.tasks_done} / ${project.task_count}`} />
            <Stat label="Hours logged" value={hours(project.hours_logged)} />
            {cost ? (
              <Stat
                label="Effort cost (approved)"
                value={money(cost.labour + cost.fixed_tasks + cost.expenses)}
                hint={Number(project.budget) ? `Budget ${money(project.budget)} · Invoiced ${money(cost.invoiced)}` : `Invoiced ${money(cost.invoiced)}`}
                tone={Number(project.budget) && cost.labour + cost.fixed_tasks + cost.expenses > project.budget ? "red" : "slate"}
              />
            ) : (
              <Stat label="Team" value={team.length} />
            )}
          </div>
          {project.description && <Card className="mb-6"><p className="text-sm text-slate-600 whitespace-pre-line">{project.description}</p></Card>}

          <Tabs value={tab} onChange={setTab} tabs={[["board", "Task board"], ["list", "Task list"], ["time", "Timesheets"], ["team", "Team"], ...(user.role === "admin" ? [["shares", "Shares (admin only)"]] : [])]} />

          {tab === "board" && (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {TASK_STATUSES.map((s) => {
                const col = tasks.filter((t) => t.status === s);
                return (
                  <div key={s} className="bg-slate-100/70 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label(s)}</span>
                      <span className="text-xs text-slate-400">{col.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.map((t) => {
                        const mine = t.assignee_id === user.id;
                        return (
                          <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                            <button className="text-left text-sm font-medium text-slate-900 hover:text-brand-700" onClick={() => (manager ? setTask(t) : null)}>{t.title}</button>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <Badge status={t.priority} />
                              {t.assignee_name && <span>{t.assignee_name}</span>}
                              {t.due_date && <span className={t.due_date < today() && t.status !== "done" ? "text-red-600" : ""}>· {date(t.due_date)}</span>}
                              {Number(t.fixed_amount) > 0 && manager && <span>· {money(t.fixed_amount)}</span>}
                            </div>
                            {(manager || mine) && (
                              <select value={t.status} onChange={(e) => moveTask(t, e.target.value)} disabled={busy}
                                className="mt-2 w-full rounded-md text-xs ring-1 ring-slate-200 border-0 py-1 px-2" aria-label="Move task">
                                {TASK_STATUSES.map((x) => <option key={x} value={x}>{label(x)}</option>)}
                              </select>
                            )}
                            {mine && t.status !== "done" && (
                              <button className="mt-2 text-xs text-brand-600 hover:underline" onClick={() => setLogging({ project_id: project.id, task_id: t.id })}>Log time</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "list" && (
            <Card padded={false}>
              <Table rows={tasks} empty="No tasks yet." onRowClick={manager ? (t) => setTask(t) : undefined} columns={[
                { key: "title", label: "Task", render: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
                { key: "assignee_name", label: "Assignee" },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "priority", label: "Priority", render: (r) => <Badge status={r.priority} /> },
                { key: "due_date", label: "Due", render: (r) => date(r.due_date) },
                { key: "estimated_hours", label: "Estimate", align: "right", render: (r) => (r.estimated_hours ? hours(r.estimated_hours) : "—") },
                ...(manager ? [{ key: "fixed_amount", label: "Fixed pay", align: "right", render: (r) => (Number(r.fixed_amount) ? money(r.fixed_amount) : "—") }] : []),
              ]} />
            </Card>
          )}

          {tab === "time" && (
            <Card padded={false}>
              <Async result={timesheets}>
                {(d) => (
                  <Table rows={d.items} empty="No time logged yet." columns={[
                    { key: "date", label: "Date", render: (r) => date(r.date) },
                    { key: "user_name", label: "Person" },
                    { key: "task_title", label: "Task" },
                    { key: "description", label: "Work done" },
                    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                    { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
                  ]} />
                )}
              </Async>
            </Card>
          )}

          {tab === "team" && (
            <Card padded={false}>
              <Table rows={team} empty="No members yet." columns={[
                { key: "name", label: "Name" },
                { key: "role", label: "Role", render: (r) => label(r.role) },
                { key: "hours", label: "Hours logged", align: "right", render: (r) => hours(r.hours) },
                ...(manager ? [{ key: "effective_rate", label: "Rate / hour", align: "right", render: (r) => `${money(r.effective_rate)}${r.rate === null ? " (default)" : ""}` }] : []),
              ]} />
            </Card>
          )}

          {tab === "shares" && user.role === "admin" && <SharesCard projectId={project.id} />}

          {editing && <ProjectForm project={project} onClose={() => setEditing(false)} onSaved={() => res.reload()} />}
          {task && <TaskForm task={task} team={team} onClose={() => setTask(null)} onSaved={res.reload} />}
          {members && <MembersModal projectId={project.id} team={team} onClose={() => setMembers(false)} onSaved={res.reload} />}
          {logging && <LogTimeModal preset={logging} onClose={() => setLogging(null)} onSaved={() => { res.reload(); timesheets.reload(); }} />}
          <Confirm open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} busy={busy} message="Delete this project with its tasks and unpaid timesheets?" />
        </>
      )}
    </Async>
  );
}

/** Admin only: a fixed percentage of the project for each member. No one else can see this. */
function SharesCard({ projectId }) {
  const res = useApi(`projects/${projectId}/shares`);
  const [edits, setEdits] = useState({});
  const [run, busy] = useAction();
  return (
    <Async result={res}>
      {(d) => {
        const pct = (m) => (edits[m.user_id] ?? String(m.percent || ""));
        const total = d.members.reduce((s, m) => s + (Number(pct(m)) || 0), 0);
        const save = () => run(async () => {
          await api(`projects/${projectId}/shares`, { method: "PUT", body: { shares: d.members.map((m) => ({ user_id: m.user_id, percent: Number(pct(m)) || 0 })) } });
          setEdits({});
          res.reload();
        }, "Shares saved");
        return (
          <Card
            title={<span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4" /> Project shares</span>}
            actions={<Button size="sm" onClick={save} busy={busy} disabled={!Object.keys(edits).length || total > 100}>Save</Button>}
            padded={false}
          >
            <p className="px-5 pt-4 text-sm text-slate-500">
              A fixed percentage of this project for each member. Only admins can see or change this; it isn't shown to the person, the project team or accounts, and isn't added to payouts.
            </p>
            <Table
              rows={d.members.map((m) => ({ ...m, id: m.user_id }))}
              empty="Add members to the project first (Team & rates)."
              columns={[
                { key: "name", label: "Member", render: (m) => <><span className="font-medium text-slate-900">{m.name}</span> <span className="text-slate-400">· {label(m.role)}</span></> },
                { key: "percent", label: "Share %", align: "right", render: (m) => (
                  <input type="number" min="0" max="100" step="any" value={pct(m)} placeholder="0" aria-label={`Share for ${m.name}`}
                    onChange={(e) => setEdits({ ...edits, [m.user_id]: e.target.value })}
                    className="w-24 text-right rounded-md border-0 ring-1 ring-slate-200 text-sm py-1 px-2" />
                ) },
                { key: "on_budget", label: `On budget (${money(d.budget)})`, align: "right", render: (m) => money((d.budget * (Number(pct(m)) || 0)) / 100) },
                { key: "on_received", label: `On payments received (${money(d.received)})`, align: "right", render: (m) => money((d.received * (Number(pct(m)) || 0)) / 100) },
              ]}
              footer={
                <tr>
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-500">Total</td>
                  <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${total > 100 ? "text-red-600" : ""}`}>{Math.round(total * 100) / 100}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money((d.budget * total) / 100)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money((d.received * total) / 100)}</td>
                </tr>
              }
            />
            {total > 100 && <p className="px-5 py-2 text-sm text-red-600">Shares add up to more than 100%.</p>}
          </Card>
        );
      }}
    </Async>
  );
}

function TaskForm({ task, onClose, onSaved }) {
  const isNew = !task.id;
  const users = useApi("users/options");
  const [f, set] = useForm({
    title: task.title || "",
    description: task.description || "",
    assignee_id: task.assignee_id || "",
    status: task.status || "todo",
    priority: task.priority || "medium",
    due_date: task.due_date || "",
    estimated_hours: task.estimated_hours ?? "",
    fixed_amount: task.fixed_amount ?? 0,
  });
  const [confirm, setConfirm] = useState(false);
  const [run, busy] = useAction();
  const paid = !!task.payout_id;

  const save = () => run(async () => {
    const body = { ...f, assignee_id: f.assignee_id || null, estimated_hours: f.estimated_hours === "" ? null : f.estimated_hours };
    if (isNew) body.project_id = task.project_id;
    await api(isNew ? "tasks" : `tasks/${task.id}`, { method: isNew ? "POST" : "PUT", body });
    onSaved();
    onClose();
  }, "Task saved");

  const remove = () => run(async () => {
    await api(`tasks/${task.id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }, "Task deleted");

  return (
    <Modal open wide onClose={onClose} title={isNew ? "Add task" : "Edit task"} footer={
      <>
        {!isNew && !paid && <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirm(true)}>Delete</Button>}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} busy={busy}>Save</Button>
      </>
    }>
      {paid && <p className="text-sm rounded-lg bg-amber-50 text-amber-800 p-3">This task is included in a payout; its fixed pay can't change.</p>}
      <Input label="Title *" value={f.title} onChange={set("title")} />
      <Textarea label="Description" value={f.description} onChange={set("description")} />
      <div className="grid sm:grid-cols-3 gap-4">
        <Select label="Assign to" value={f.assignee_id} onChange={set("assignee_id")} placeholder="Unassigned" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
        <Select label="Status" value={f.status} onChange={set("status")} options={TASK_STATUSES.map((s) => [s, label(s)])} />
        <Select label="Priority" value={f.priority} onChange={set("priority")} options={PRIORITIES.map((s) => [s, label(s)])} />
        <Input label="Due date" type="date" value={f.due_date} onChange={set("due_date")} />
        <Input label="Estimated hours" type="number" min="0" step="any" value={f.estimated_hours} onChange={set("estimated_hours")} />
        <Input label="Fixed pay (optional)" type="number" min="0" step="any" value={f.fixed_amount} onChange={set("fixed_amount")} disabled={paid} hint="Paid when the task is done, on top of hours" />
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={busy} message="Delete this task? Logged time stays on the project without a task." />
    </Modal>
  );
}

function MembersModal({ projectId, team, onClose, onSaved }) {
  const users = useApi("users/options");
  const [rows, setRows] = useState(team.map((m) => ({ user_id: m.id, rate: m.rate ?? "" })));
  const [run, busy] = useAction();
  const toggle = (uid) => setRows(rows.some((r) => r.user_id === uid) ? rows.filter((r) => r.user_id !== uid) : [...rows, { user_id: uid, rate: "" }]);
  const save = () => run(async () => {
    await api(`projects/${projectId}/members`, { method: "PUT", body: { members: rows.map((r) => ({ user_id: r.user_id, rate: r.rate === "" ? null : r.rate })) } });
    onSaved();
    onClose();
  }, "Team updated");
  return (
    <Modal open onClose={onClose} title="Team & rates" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save</Button></>}>
      <p className="text-sm text-slate-500">Tick who works on this project. Leave the rate empty to use the person's default hourly rate.</p>
      <div className="divide-y divide-slate-100">
        {(users.data?.items || []).map((u) => {
          const row = rows.find((r) => r.user_id === u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <input type="checkbox" checked={!!row} onChange={() => toggle(u.id)} className="rounded border-slate-300" aria-label={`Include ${u.name}`} />
              <span className="flex-1 text-sm">{u.name} <span className="text-slate-400">· {label(u.role)}</span></span>
              {row && (
                <input type="number" min="0" step="any" placeholder="Default rate" value={row.rate}
                  onChange={(e) => setRows(rows.map((r) => (r.user_id === u.id ? { ...r, rate: e.target.value } : r)))}
                  className="w-32 text-right rounded-md border-0 ring-1 ring-slate-200 text-sm py-1 px-2" aria-label={`Rate for ${u.name}`} />
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
