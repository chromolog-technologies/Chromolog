import { useState } from "react";
import { money, today, label } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Stat, Table, Button, Input } from "../../components/ui";
import { LOST_REASONS } from "./Leads";

const monthLabel = (p) => new Date(`${p}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const pct = (n, of) => (of ? `${Math.round((n / of) * 100)}%` : "—");

function yearAgo() {
  const [y, m] = today().split("-").map(Number);
  const d = new Date(y, m - 12, 1); // first day of the month, 11 months back
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function waitText(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 6) / 10} hours`;
  return `${Math.round(minutes / 144) / 10} days`;
}

const STAGES = [
  ["leads", "New leads"],
  ["contacted", "Contacted"],
  ["meeting", "Meeting"],
  ["proposal", "Proposal"],
  ["won", "Won"],
];

/** Sales funnel: where leads come from, how far they get, how fast we answer, and why we lose them. */
export default function LeadReport() {
  const [range, setRange] = useState({ from: yearAgo(), to: today() });
  const res = useApi(`leads/report?from=${range.from}&to=${range.to}`);
  return (
    <>
      <PageHeader title="Sales funnel" subtitle="Leads created in the period (spam left out), how far they got, and how fast the team first replied." />
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        <div className="flex gap-1 pb-0.5">
          <Button size="sm" variant="secondary" onClick={() => setRange({ from: `${today().slice(0, 8)}01`, to: today() })}>This month</Button>
          <Button size="sm" variant="secondary" onClick={() => setRange({ from: yearAgo(), to: today() })}>Last 12 months</Button>
        </div>
      </div>
      <Async result={res}>
        {(d) => {
          const t = d.total || {};
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="New leads" value={t.leads || 0} />
                <Stat label="Won" value={`${t.won || 0} (${pct(t.won, t.leads)})`} tone="green" hint={`Won value ${money(t.won_value || 0)}`} />
                <Stat label="Typical first reply" value={waitText(d.median_first_response_minutes)} tone="brand" hint={`Median of ${d.answered} answered leads`} />
                <Stat label="Still waiting for a first reply" value={d.unanswered} tone={d.unanswered ? "amber" : "slate"} />
              </div>

              <Card title="Funnel">
                <div className="space-y-2">
                  {STAGES.map(([k, name]) => (
                    <div key={k} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-slate-600">{name}</span>
                      <div className="flex-1 h-6 rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: t.leads ? `${((t[k] || 0) / t.leads) * 100}%` : 0 }} />
                      </div>
                      <span className="w-20 shrink-0 text-right tabular-nums">{t[k] || 0} <span className="text-slate-400">{pct(t[k], t.leads)}</span></span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Each bar counts leads that reached at least that stage. Invoiced to clients won from these leads: {money(d.invoiced_to_converted_clients)}.
                </p>
              </Card>

              <Card title="By source" padded={false}>
                <Table
                  rows={d.by_source}
                  empty="No leads in this period."
                  columns={[
                    { key: "source", label: "Source", render: (r) => label(r.source) },
                    { key: "leads", label: "Leads", align: "right" },
                    { key: "meeting", label: "Meeting", align: "right" },
                    { key: "won", label: "Won", align: "right" },
                    { key: "rate", label: "Win rate", align: "right", render: (r) => pct(r.won, r.leads) },
                    { key: "won_value", label: "Won value", align: "right", render: (r) => money(r.won_value) },
                  ]}
                />
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card title="By month" padded={false}>
                  <Table
                    rows={d.by_month}
                    empty="No leads in this period."
                    columns={[
                      { key: "month", label: "Month", render: (r) => monthLabel(r.month) },
                      { key: "leads", label: "Leads", align: "right" },
                      { key: "won", label: "Won", align: "right" },
                    ]}
                  />
                </Card>
                <Card title="Why leads were lost" padded={false}>
                  <Table
                    rows={d.lost_reasons}
                    empty="No lost leads in this period."
                    columns={[
                      { key: "reason", label: "Reason", render: (r) => LOST_REASONS[r.reason] || "Not recorded (lost before reasons were asked)" },
                      { key: "leads", label: "Leads", align: "right" },
                    ]}
                  />
                </Card>
              </div>
            </div>
          );
        }}
      </Async>
    </>
  );
}
