import { useState } from "react";
import { date, dateTime, hours, label, today, addDays } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Badge, Input, Select, Empty } from "../../components/ui";

export default function DailyReports() {
  const [day, setDay] = useState(today());
  const [userId, setUserId] = useState("");
  const users = useApi("users/options");
  const qs = userId ? `user_id=${userId}&from=${addDays(day, -30)}&to=${day}` : `date=${day}`;
  const reports = useApi(`reports?${qs}`);
  const missing = useApi(userId ? null : `reports/missing?date=${day}`);

  return (
    <>
      <PageHeader title="Daily reports" subtitle="What everyone worked on. Pick a date, or a person to see their last 30 days." />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input label="Date" type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} />
        <Select label="Person" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Everyone" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
      </div>
      {missing.data?.items?.length > 0 && (
        <Card title={`Not submitted for ${date(day)}`} className="mb-6">
          <div className="flex flex-wrap gap-2">
            {missing.data.items.map((m) => <Badge key={m.id} tone="amber">{m.name} · {label(m.role)}</Badge>)}
          </div>
        </Card>
      )}
      <Async result={reports}>
        {(d) =>
          d.items.length === 0 ? (
            <Card><Empty text="No reports for this selection." /></Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {d.items.map((r) => (
                <Card key={r.id} title={`${r.user_name} · ${date(r.date)}`} actions={r.hours ? <Badge tone="brand">{hours(r.hours)}</Badge> : null}>
                  <div className="space-y-3 text-sm">
                    <Section title="Summary" text={r.summary} />
                    <Section title="Completed" text={r.tasks_completed} />
                    <Section title="Blockers" text={r.blockers} tone="text-red-700" />
                    <Section title="Plan for tomorrow" text={r.plan_tomorrow} />
                    <p className="text-xs text-slate-400">Submitted {dateTime(r.updated_at || r.created_at)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </Async>
    </>
  );
}

function Section({ title, text, tone = "text-slate-700" }) {
  if (!text) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <p className={`whitespace-pre-line ${tone}`}>{text}</p>
    </div>
  );
}

