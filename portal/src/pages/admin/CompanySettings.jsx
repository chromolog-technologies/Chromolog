import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useAction, PageHeader, Card, Button, Input, Textarea, Select, Loading } from "../../components/ui";

export default function CompanySettings() {
  const { settings, refreshSettings } = useAuth();
  const [f, setF] = useState(null);
  const [run, busy] = useAction();

  useEffect(() => {
    if (settings) {
      setF({
        ...settings,
        expense_categories: settings.expense_categories.join("\n"),
        income_categories: settings.income_categories.join("\n"),
      });
    }
  }, [settings]);

  if (!f) return <Loading />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target.checked ? "1" : "0") : e.target.value });

  const save = () => run(async () => {
    await api("settings", { method: "PUT", body: f });
    await refreshSettings();
  }, "Settings saved");

  return (
    <>
      <PageHeader title="Company settings" subtitle="Shown on quotations and invoices." actions={<Button onClick={save} busy={busy}>Save settings</Button>} />
      <div className="space-y-6 max-w-4xl">
        <Card title="Company">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Company name" value={f.company_name} onChange={set("company_name")} />
            <Input label="Website" value={f.company_website} onChange={set("company_website")} />
            <Input label="Email" value={f.company_email} onChange={set("company_email")} />
            <Input label="Phone" value={f.company_phone} onChange={set("company_phone")} />
          </div>
          <Textarea className="mt-4" label="Address" rows={2} value={f.company_address} onChange={set("company_address")} />
        </Card>

        <Card title="Invoices & quotations">
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Invoice prefix" value={f.invoice_prefix} onChange={set("invoice_prefix")} hint="e.g. INV → INV-2026-0001" />
            <Input label="Quotation prefix" value={f.quotation_prefix} onChange={set("quotation_prefix")} />
            <Input label="Payment terms (days)" type="number" min="0" value={f.payment_terms_days} onChange={set("payment_terms_days")} />
            <Select label="Currency" value={f.currency} onChange={set("currency")} options={[["INR", "INR — Indian rupee"], ["AED", "AED — UAE dirham"], ["USD", "USD — US dollar"]]} />
            <Input label="Currency symbol" value={f.currency_symbol} onChange={set("currency_symbol")} />
          </div>
          <Textarea className="mt-4" label="Bank / UPI details (printed on invoices)" rows={3} value={f.bank_details} onChange={set("bank_details")} placeholder={"Account name: ...\nAccount no: ...\nIFSC: ...\nUPI: ..."} />
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Textarea label="Default invoice terms" rows={3} value={f.invoice_terms} onChange={set("invoice_terms")} />
            <Textarea label="Default quotation terms" rows={3} value={f.quotation_terms} onChange={set("quotation_terms")} />
          </div>
        </Card>

        <Card title="Tax">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.tax_enabled === "1"} onChange={set("tax_enabled")} className="rounded border-slate-300" />
            Charge tax on invoices (switch on once the company is GST-registered)
          </label>
          {f.tax_enabled === "1" && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Input label="Tax name" value={f.tax_label} onChange={set("tax_label")} />
              <Input label="Your tax ID (GSTIN)" value={f.tax_id} onChange={set("tax_id")} />
            </div>
          )}
        </Card>

        <Card title="Accounting categories">
          <div className="grid sm:grid-cols-2 gap-4">
            <Textarea label="Expense categories (one per line)" rows={10} value={f.expense_categories} onChange={set("expense_categories")} />
            <Textarea label="Other income categories (one per line)" rows={10} value={f.income_categories} onChange={set("income_categories")} />
          </div>
        </Card>
      </div>
    </>
  );
}
