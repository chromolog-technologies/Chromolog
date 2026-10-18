import { money, date, hours } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Stat, Table, Badge } from "../../components/ui";

export default function MyEarnings() {
  const res = useApi("me/earnings");
  return (
    <>
      <PageHeader title="My earnings" subtitle="Approved hours × your rate, plus fixed-price tasks you completed." />
      <Async result={res}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Stat label="Approved, not yet paid" value={money(d.unpaid)} tone="green" />
              <Stat label="Hours waiting for approval" value={hours(d.pending_approval_hours)} tone="amber" />
              <Stat label="Paid so far" value={money(d.payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.total), 0))} />
            </div>
            <Card title="Payouts" padded={false}>
              <Table
                rows={d.payouts}
                empty="No payouts yet."
                columns={[
                  { key: "period", label: "Period", render: (r) => `${date(r.period_start)} – ${date(r.period_end)}` },
                  { key: "hours", label: "Hours", align: "right", render: (r) => hours(r.hours) },
                  { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                  { key: "paid_date", label: "Paid on", render: (r) => date(r.paid_date) },
                  { key: "total", label: "Amount", align: "right", render: (r) => money(r.total) },
                ]}
              />
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
