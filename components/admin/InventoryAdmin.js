"use client";
import { useState } from "react";
import { api, useLoad, Field } from "./api";

const blank = { product_id: "", batch_no: "", expiry_date: "", qty_received: "", purchase_price: "", supplier: "" };
const status = (d) => (d <= 0 ? ["Expired", "pill bad"] : d <= 30 ? [`${d}d left`, "pill warn"] : d <= 60 ? [`${d}d left`, "pill warn2"] : [`${d}d left`, "pill ok"]);

export default function InventoryAdmin() {
  const { data, err, reload } = useLoad("/api/admin/inventory");
  const prods = useLoad("/api/admin/products");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg("");
    try { await api("/api/admin/inventory", "POST", form); setForm(null); reload(); prods.reload(); } catch (x) { setMsg(x.message); }
  };
  const adjust = async (b) => {
    const v = prompt(`Set available quantity for ${b.product} (batch ${b.batch_no}):`, b.qty_available);
    if (v === null) return;
    try { await api(`/api/admin/inventory/${b.id}`, "PATCH", { qty_available: v }); reload(); } catch (x) { alert(x.message); }
  };

  return (
    <div>
      <div className="bar"><h1>Inventory</h1><button className="btn" onClick={() => setForm({ ...blank })}>+ Receive stock</button></div>
      <p className="muted">Products with no batch recorded are treated as “stock not tracked” (always orderable). Once a batch exists, expired and sold-out stock cannot be ordered.</p>
      {err && <p className="bad">{err}</p>}
      {form && (
        <form className="box grid2" onSubmit={save}>
          <Field label="Product *" wide><select value={form.product_id} onChange={set("product_id")} required><option value="">Select…</option>{(prods.data?.products || []).map((p) => <option key={p.id} value={p.id}>{p.name_en} ({p.sku})</option>)}</select></Field>
          <Field label="Batch no. *"><input value={form.batch_no} onChange={set("batch_no")} required maxLength={60} /></Field>
          <Field label="Expiry date *"><input type="date" value={form.expiry_date} onChange={set("expiry_date")} required /></Field>
          <Field label="Quantity received *"><input type="number" min="1" step="1" value={form.qty_received} onChange={set("qty_received")} required /></Field>
          <Field label="Purchase price / unit (₹)"><input type="number" min="0" step="0.01" value={form.purchase_price} onChange={set("purchase_price")} /></Field>
          <Field label="Supplier" wide><input value={form.supplier} onChange={set("supplier")} maxLength={160} /></Field>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn">Save batch</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {!data ? <p>Loading…</p> : (
        <table className="tbl box"><thead><tr><th>Product</th><th>Batch</th><th>Expiry</th><th>Available</th><th>Supplier</th><th></th></tr></thead>
          <tbody>{data.batches.map((b) => { const [t, cls] = status(b.days_left); return (
            <tr key={b.id}><td>{b.product}<div className="muted">{b.sku}</div></td><td>{b.batch_no}</td>
              <td>{b.expiry_date} <span className={cls}>{t}</span></td><td>{b.qty_available} <span className="muted">/ {b.qty_received}</span></td>
              <td className="muted">{b.supplier || "—"}</td><td className="r"><button className="link-btn" onClick={() => adjust(b)}>Adjust</button></td></tr>); })}
            {data.batches.length === 0 && <tr><td colSpan={6} className="muted">No batches yet.</td></tr>}</tbody></table>
      )}
    </div>
  );
}
