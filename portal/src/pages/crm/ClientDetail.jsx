import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, FileText, Receipt, FileSignature } from "lucide-react";
import { useAuth, can } from "../../lib/auth";
import { money, date, label } from "../../lib/format";
import { DOC_LABELS, stateName } from "../../lib/gst";
import { useApi, Async, PageHeader, Card, Table, Badge, Button } from "../../components/ui";
import { ClientForm } from "./Clients";
import { ContractForm } from "./Contracts";

export default function ClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, settings } = useAuth();
  const res = useApi(`clients/${id}`);
  const [editing, setEditing] = useState(false);
  const [contract, setContract] = useState(null);

  return (
    <Async result={res}>
      {({ client, contracts, invoices, quotations, projects }) => (
        <>
          <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="h-4 w-4" /> Clients
          </Link>
          <PageHeader
            title={client.company || client.name}
            subtitle={[client.company ? client.name : null, client.email, client.phone].filter(Boolean).join(" · ")}
            actions={
              can(user, "marketing", "accounts") && (
                <>
                  <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
                  <Button variant="secondary" icon={FileSignature} onClick={() => setContract({ client_id: client.id })}>Add contract</Button>
                  <Button variant="secondary" icon={FileText} onClick={() => nav(`/quotations/new?client_id=${client.id}`)}>New quotation</Button>
                  {can(user, "accounts") && <Button icon={Receipt} onClick={() => nav(`/invoices/new?client_id=${client.id}`)}>New invoice</Button>}
                </>
              )
            }
          />
          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Details">
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Billing address</dt><dd className="whitespace-pre-line">{client.address || "—"}</dd></div>
                <div><dt className="text-slate-500">GSTIN</dt><dd>{client.tax_id || "—"}</dd></div>
                <div><dt className="text-slate-500">State</dt><dd>{stateName(settings, client.state_code) || "—"}</dd></div>
                {client.lead_id && can(user, "marketing") && <div><dt className="text-slate-500">Original lead</dt><dd><Link className="text-brand-600" to={`/leads/${client.lead_id}`}>View lead</Link></dd></div>}
                {client.notes && <div><dt className="text-slate-500">Notes</dt><dd className="whitespace-pre-line">{client.notes}</dd></div>}
              </dl>
            </Card>
            <div className="lg:col-span-2 space-y-6">
              <Card title="Projects" padded={false}>
                <Table rows={projects} empty="No projects." onRowClick={(r) => nav(`/projects/${r.id}`)} columns={[
                  { key: "name", label: "Project" },
                  { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                  { key: "deadline", label: "Deadline", render: (r) => date(r.deadline) },
                ]} />
              </Card>
              {can(user, "marketing", "accounts") && (
                <>
                  <Card title="Contracts" padded={false}>
                    <Table rows={contracts} empty="No contracts." onRowClick={(r) => setContract(r)} columns={[
                      { key: "title", label: "Contract" },
                      { key: "type", label: "Type", render: (r) => label(r.type) },
                      { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                      { key: "end_date", label: "Ends", render: (r) => date(r.end_date) },
                      { key: "value", label: "Value", align: "right", render: (r) => money(r.value) },
                    ]} />
                  </Card>
                  <Card title="Invoices" padded={false}>
                    <Table rows={invoices} empty="No invoices." onRowClick={can(user, "accounts") ? (r) => nav(`/invoices/${r.id}`) : undefined} columns={[
                      { key: "number", label: "Invoice", render: (r) => (r.status === "draft" ? "Draft" : `${r.number}${r.doc_type && r.doc_type !== "invoice" ? ` (${DOC_LABELS[r.doc_type]})` : ""}`) },
                      { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                      { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
                      { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
                      { key: "balance", label: "Balance", align: "right", render: (r) => money(r.total - r.amount_paid) },
                    ]} />
                  </Card>
                  <Card title="Quotations" padded={false}>
                    <Table rows={quotations} empty="No quotations." onRowClick={(r) => nav(`/quotations/${r.id}`)} columns={[
                      { key: "number", label: "Quotation" },
                      { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                      { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
                      { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
                    ]} />
                  </Card>
                </>
              )}
            </div>
          </div>
          {editing && <ClientForm open client={client} onClose={() => setEditing(false)} onSaved={() => res.reload()} />}
          {contract && <ContractForm contract={contract} onClose={() => setContract(null)} onSaved={() => res.reload()} />}
        </>
      )}
    </Async>
  );
}
