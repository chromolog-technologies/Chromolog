import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api } from "../../lib/api";
import { date, hours, today } from "../../lib/format";
import { useApi, useAction, PageHeader, Card, Button, Input, Textarea, Table } from "../../components/ui";

export default function MyReport() {
  const [day, setDay] = useState(() => today());
  const existing = useApi(`reports?mine=1&date=${day}`);
  const history = useApi("reports?mine=1");
  const [f, setF] = useState({ summary: "", tasks_completed: "", blockers: "", plan_tomorrow: "", hours: "" });
  const [run, busy] = useAction();

  useEffect(() => {
    const r = existing.data?.items?.[0];
    setF({
      summary: r?.summary || "",
      tasks_completed: r?.tasks_completed || "",
      blockers: r?.blockers || "",
      plan_tomorrow: r?.plan_tomorrow || "",
      hours: r?.hours ?? "",
    });
  }, [existing.data]);

  const submit = () => run(async () => {
    await api("reports", { method: "POST", body: { ...f, date: day, hours: f.hours === "" ? null : f.hours } });
    existing.reload();
    history.reload();
  }, "Report submitted");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const already = !!existing.data?.items?.length;
  const minDay = (() => {
    const d = new Date(`${today()}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <>
      <PageHeader title="Daily report" subtitle="A short end-of-day update for the team. You can edit it until 7 days later." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={already ? `Update report for ${date(day)}` : `Report for ${date(day)}`} className="lg:col-span-2">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Date" type="date" value={day} min={minDay} max={today()} onChange={(e) => setDay(e.target.value)} />
              <Input label="Hours worked" type="number" min="0" max="24" step="0.25" value={f.hours} onChange={set("hours")} />
            </div>
            <Textarea label="Summary of the day *" rows={3} value={f.summary} onChange={set("summary")} placeholder="What did you work on today?" />
            <Textarea label="Tasks completed" rows={3} value={f.tasks_completed} onChange={set("tasks_completed")} placeholder="One per line" />
            <Textarea label="Blockers / need help with" rows={2} value={f.blockers} onChange={set("blockers")} />
            <Textarea label="Plan for tomorrow" rows={2} value={f.plan_tomorrow} onChange={set("plan_tomorrow")} />
            <div className="flex justify-end">
              <Button icon={Send} onClick={submit} busy={busy} disabled={!f.summary.trim()}>{already ? "Update report" : "Submit report"}</Button>
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="My recent reports" padded={false}>
            <Table
              rows={(history.data?.items || []).slice(0, 14)}
              empty="No reports yet."
              onRowClick={(r) => setDay(r.date)}
              columns={[
                { key: "date", label: "Date", render: (r) => date(r.date) },
                { key: "hours", label: "Hours", align: "right", render: (r) => (r.hours ? hours(r.hours) : "—") },
              ]}
            />
          </Card>
          <Card title="Submit from another app">
            <p className="text-xs text-slate-500 leading-relaxed">
              Reports can also be sent through the API. Create a personal API key on your Profile page, then send:
            </p>
            <pre className="mt-2 text-[11px] bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto">{`POST /api/ai/v1/reports
Authorization: Bearer <your key>
Content-Type: application/json

{"summary": "...",
 "tasks_completed": "...",
 "hours": 8}`}</pre>
          </Card>
        </div>
      </div>
    </>
  );
}
