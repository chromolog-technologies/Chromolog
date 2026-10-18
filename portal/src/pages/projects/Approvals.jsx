import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../lib/api";
import { date, hours } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Table, Badge, Button, Tabs, Select } from "../../components/ui";

export default function Approvals() {
  const [status, setStatus] = useState("pending");
  const [userId, setUserId] = useState("");
  const users = useApi("users/options");
  const res = useApi(`timesheets?status=${status}${userId ? `&user_id=${userId}` : ""}`);
  const [selected, setSelected] = useState([]);
  const [run, busy] = useAction();

  const review = (s) => run(async () => {
    await api("timesheets/review", { method: "POST", body: { ids: selected, status: s } });
    setSelected([]);
    res.reload();
  }, s === "approved" ? "Approved" : "Rejected");

  const rows = res.data?.items || [];
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  return (
    <>
      <PageHeader
        title="Timesheet approvals"
        subtitle="Only approved hours count towards freelancer pay."
        actions={status === "pending" && (
          <>
            <Button variant="secondary" icon={XCircle} disabled={!selected.length} busy={busy} onClick={() => review("rejected")}>Reject</Button>
            <Button icon={CheckCircle2} disabled={!selected.length} busy={busy} onClick={() => review("approved")}>Approve {selected.length || ""}</Button>
          </>
        )}
      />
      <Tabs value={status} onChange={(s) => { setStatus(s); setSelected([]); }} tabs={[["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]]} />
      <div className="mb-4 max-w-xs">
        <Select value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Everyone" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
      </div>
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              empty={status === "pending" ? "Nothing waiting for approval." : "No entries."}
              columns={[
                ...(status === "pending"
                  ? [{
                      key: "check",
                      label: <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? [] : rows.map((r) => r.id))} aria-label="Select all" className="rounded border-slate-300" />,
                      render: (r) => (
                        <input type="checkbox" checked={selected.includes(r.id)} aria-label="Select entry" className="rounded border-slate-300"
                          onChange={() => setSelected(selected.includes(r.id) ? selected.filter((x) => x !== r.id) : [...selected, r.id])} />
                      ),
                    }]
                  : []),
                { key: "date", label: "Date", render: (r) => date(r.date) },
                { key: "user_name", label: "Person" },
                { key: "project_name", label: "Project" },
                { key: "task_title", label: "Task" },
                { key: "description", label: "Work done", className: "max-w-sm" },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
              ]}
              footer={
                <tr>
                  <td colSpan={status === "pending" ? 7 : 6} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Total</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{hours(d.total_hours)}</td>
                </tr>
              }
            />
          )}
        </Async>
      </Card>
    </>
  );
}
