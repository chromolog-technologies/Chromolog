import { Plus, Trash2 } from "lucide-react";
import { money } from "../lib/format";
import { calcLines, GST_RATES } from "../lib/gst";
import { Button } from "./ui";

export const blankLine = (gst = 0) => ({ service_id: null, description: "", hsn_sac: "", unit: "", quantity: 1, unit_price: "", discount: "", gst_rate: gst });

const cell = "w-full rounded-md border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm py-1.5 px-2";

/**
 * Line items with GST. Picking a service fills its description, rate, unit, HSN/SAC and GST rate;
 * every field stays editable, and lines can be typed in by hand.
 */
export default function LineItems({ items, onChange, services = [], supplyType, reverseCharge, defaultGst = 0, showTotals = true }) {
  const taxed = supplyType === "intra" || supplyType === "inter";
  const calc = calcLines(items, supplyType, reverseCharge);
  const setLine = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const pickService = (i, id) => {
    const s = services.find((x) => String(x.id) === id);
    if (!s) return setLine(i, { service_id: null });
    setLine(i, {
      service_id: s.id,
      description: s.description ? `${s.name}\n${s.description}` : s.name,
      hsn_sac: s.hsn_sac || "",
      unit: s.unit || "",
      unit_price: s.rate,
      gst_rate: s.gst_rate,
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-sm">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-xs text-slate-500">
              <th className="text-left px-3 py-2 font-semibold w-8">#</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[240px]">Service / description</th>
              <th className="text-left px-2 py-2 font-semibold w-24">HSN/SAC</th>
              <th className="text-right px-2 py-2 font-semibold w-20">Qty</th>
              <th className="text-left px-2 py-2 font-semibold w-20">Unit</th>
              <th className="text-right px-2 py-2 font-semibold w-28">Rate</th>
              <th className="text-right px-2 py-2 font-semibold w-24">Discount</th>
              {taxed && <th className="text-right px-2 py-2 font-semibold w-20">GST %</th>}
              <th className="text-right px-3 py-2 font-semibold w-32">Amount</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 align-top">
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                <td className="px-2 py-2 space-y-1.5">
                  {services.length > 0 && (
                    <select value={it.service_id || ""} onChange={(e) => pickService(i, e.target.value)} className={`${cell} text-slate-600`} aria-label="Service">
                      <option value="">Custom item (type below)</option>
                      {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                  <textarea rows={2} value={it.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Description of the service or goods" className={`${cell} resize-y`} />
                </td>
                <td className="px-2 py-2"><input value={it.hsn_sac || ""} onChange={(e) => setLine(i, { hsn_sac: e.target.value.replace(/\D/g, "").slice(0, 8) })} inputMode="numeric" className={cell} aria-label="HSN/SAC" /></td>
                <td className="px-2 py-2"><input type="number" min="0" step="any" value={it.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} className={`${cell} text-right`} aria-label="Quantity" /></td>
                <td className="px-2 py-2"><input value={it.unit || ""} onChange={(e) => setLine(i, { unit: e.target.value })} placeholder="Nos" className={cell} aria-label="Unit" /></td>
                <td className="px-2 py-2"><input type="number" min="0" step="any" value={it.unit_price} onChange={(e) => setLine(i, { unit_price: e.target.value })} className={`${cell} text-right`} aria-label="Rate" /></td>
                <td className="px-2 py-2"><input type="number" min="0" step="any" value={it.discount ?? ""} onChange={(e) => setLine(i, { discount: e.target.value })} placeholder="0" className={`${cell} text-right`} aria-label="Discount amount" /></td>
                {taxed && (
                  <td className="px-2 py-2">
                    <select value={String(Number(it.gst_rate) || 0)} onChange={(e) => setLine(i, { gst_rate: e.target.value })} className={`${cell} text-right`} aria-label="GST rate">
                      {[...new Set([...GST_RATES, Number(it.gst_rate) || 0])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                )}
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {money(taxed ? calc.rows[i].total : calc.rows[i].taxable)}
                  {taxed && calc.rows[i].taxable > 0 && <div className="text-[11px] text-slate-400">incl. {money(calc.rows[i].total - calc.rows[i].taxable)} GST</div>}
                </td>
                <td className="pr-3 py-2.5">
                  {items.length > 1 && (
                    <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label="Remove line">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-t border-slate-100">
        <div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => onChange([...items, blankLine(defaultGst)])}>Add line</Button>
        </div>
        {showTotals && <Totals calc={calc} supplyType={supplyType} reverseCharge={reverseCharge} />}
      </div>
    </>
  );
}

export function Totals({ calc, supplyType, reverseCharge }) {
  const row = (label, value, cls = "") => (
    <div className={`flex justify-between ${cls}`}><dt className="text-slate-500">{label}</dt><dd className="tabular-nums">{value}</dd></div>
  );
  return (
    <dl className="w-full sm:w-80 space-y-1.5 text-sm">
      {row("Subtotal", money(calc.subtotal))}
      {calc.discount > 0 && row("Discount", `−${money(calc.discount)}`)}
      {(supplyType === "intra" || supplyType === "inter") && (
        <>
          {row("Taxable value", money(calc.taxable))}
          {supplyType === "intra" ? <>{row("CGST", money(calc.cgst))}{row("SGST", money(calc.sgst))}</> : row("IGST", money(calc.igst))}
        </>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-base"><dt>Grand total</dt><dd className="tabular-nums">{money(calc.total)}</dd></div>
      {reverseCharge && calc.tax > 0 && <p className="text-xs text-amber-700">Reverse charge: GST of {money(calc.tax)} is paid by the customer, so it isn't added to the total.</p>}
    </dl>
  );
}
