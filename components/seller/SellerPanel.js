"use client";
import { useState } from "react";
import { api, useLoad, Field, inrA, Status, Empty, fmtDate } from "../admin/api";

const Stat = ({ k, v, sub }) => <div className="box" style={{ flex: "1 1 150px", margin: 0 }}><small className="muted">{k}</small><div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>{sub && <small className="muted">{sub}</small>}</div>;

export function SellerDashboard() {
  const { data: d, err } = useLoad("/api/seller/dashboard");
  if (err) return <p className="bad">{err}</p>;
  if (!d) return <p>Loading…</p>;
  return (
    <div>
      <div className="bar"><h1>Dashboard</h1></div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap", justifyContent: "flex-start" }}>
        <Stat k="Orders to pack" v={d.to_pack} /><Stat k="Total orders" v={d.orders} />
        <Stat k="Live listings" v={d.live} sub={`${d.products} total`} /><Stat k="Batches expiring ≤ 60d" v={d.expiring} />
      </div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap", justifyContent: "flex-start", marginTop: 12 }}>
        <Stat k="Delivered sales" v={inrA(d.gross)} /><Stat k={`Veda commission (${d.commission_percent}%)`} v={inrA(d.commission)} />
        <Stat k="Paid out" v={inrA(d.paid)} /><Stat k="Balance to receive" v={inrA(d.balance)} />
      </div>
      <p className="muted" style={{ marginTop: 14 }}>New listings go live only after Veda reviews them. Earnings count after the order is delivered.</p>
    </div>
  );
}

const blank = { name_en: "", category_id: "", product_type: "ayurvedic", pack_size: "", mrp: "", selling_price: "", gst_percent: 12, hsn_code: "", image_url: "", description_en: "", ingredients: "", usage_info: "" };

export function SellerProducts() {
  const { data, err, reload } = useLoad("/api/seller/products");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setMsg("");
    try { const r = await api(form.id ? `/api/seller/products/${form.id}` : "/api/seller/products", form.id ? "PATCH" : "POST", form); setForm(null); reload(); if (r.review) alert("Saved. The listing is sent for Veda review again."); }
    catch (x) { setMsg(x.message); }
  };
  const off = async (p) => { try { await api(`/api/seller/products/${p.id}`, "PATCH", { is_active: false }); reload(); } catch (x) { alert(x.message); } };
  return (
    <div>
      <div className="bar"><h1>My listings</h1><button className="btn" onClick={() => setForm({ ...blank })}>+ Add product</button></div>
      <p className="muted">Prescription-only (Schedule H/H1/X) medicines cannot be listed. New or edited listings are reviewed by Veda before they appear on the store.</p>
      {err && <p className="bad">{err}</p>}
      {form && (
        <form className="box grid2" onSubmit={save}>
          <Field label="Product name *" wide><input value={form.name_en} onChange={set("name_en")} required maxLength={200} /></Field>
          <Field label="Category"><select value={form.category_id ?? ""} onChange={set("category_id")}><option value="">—</option>{(data?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></Field>
          <Field label="Type *"><select value={form.product_type} onChange={set("product_type")}><option value="ayurvedic">Ayurvedic</option><option value="homeopathy">Homeopathy</option><option value="healthcare">Healthcare</option></select></Field>
          <Field label="Pack size"><input value={form.pack_size || ""} onChange={set("pack_size")} placeholder="60 capsules" maxLength={60} /></Field>
          <Field label="HSN code"><input value={form.hsn_code || ""} onChange={set("hsn_code")} maxLength={10} /></Field>
          <Field label="MRP (₹) *"><input type="number" step="0.01" min="0.01" value={form.mrp} onChange={set("mrp")} required /></Field>
          <Field label="Selling price (₹) *"><input type="number" step="0.01" min="0.01" value={form.selling_price} onChange={set("selling_price")} required /></Field>
          <Field label="GST %"><input type="number" step="0.01" min="0" max="28" value={form.gst_percent} onChange={set("gst_percent")} /></Field>
          <Field label="Image URL (https)"><input value={form.image_url || ""} onChange={set("image_url")} placeholder="https://…" /></Field>
          <Field label="Description" wide><textarea rows={3} value={form.description_en || ""} onChange={set("description_en")} /></Field>
          <Field label="Ingredients / composition" wide><textarea rows={2} value={form.ingredients || ""} onChange={set("ingredients")} /></Field>
          <Field label="Usage / dosage info" wide><textarea rows={2} value={form.usage_info || ""} onChange={set("usage_info")} /></Field>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn">Submit for review</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {!data ? <p>Loading…</p> : data.products.length === 0 ? <Empty>No listings yet. Add your first product.</Empty> : (
        <table className="tbl box"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
          {data.products.map((p) => <tr key={p.id}><td>{p.name_en}<div className="muted">{p.sku}</div></td><td>{inrA(p.selling_price)} <s className="muted">{inrA(p.mrp)}</s></td><td>{p.stock}</td>
            <td><Status s={p.is_active ? "approved" : "pending"} /> <span className="muted">{p.is_active ? "live" : "in review / off"}</span></td>
            <td className="r"><button className="link-btn" onClick={() => setForm({ ...p, image_url: p.image_url || "" })}>Edit</button>{p.is_active && <> · <button className="link-btn" onClick={() => off(p)}>Switch off</button></>}</td></tr>)}
        </tbody></table>
      )}
    </div>
  );
}

const blankB = { product_id: "", batch_no: "", expiry_date: "", qty_received: "", purchase_price: "" };
const st = (d) => (d <= 0 ? ["Expired", "pill bad"] : d <= 30 ? [`${d}d left`, "pill warn"] : d <= 60 ? [`${d}d left`, "pill warn2"] : [`${d}d left`, "pill ok"]);

export function SellerInventory() {
  const { data, err, reload } = useLoad("/api/seller/inventory");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setMsg(""); try { await api("/api/seller/inventory", "POST", form); setForm(null); reload(); } catch (x) { setMsg(x.message); } };
  return (
    <div>
      <div className="bar"><h1>Stock & batches</h1><button className="btn" onClick={() => setForm({ ...blankB })}>+ Add batch</button></div>
      <p className="muted">Every batch needs its batch number and expiry. Customers receive the earliest-expiring batch first; batches within 30 days of expiry are not accepted.</p>
      {err && <p className="bad">{err}</p>}
      {form && (
        <form className="box grid2" onSubmit={save}>
          <Field label="Product *" wide><select value={form.product_id} onChange={set("product_id")} required><option value="">Select…</option>{(data?.products || []).map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}</select></Field>
          <Field label="Batch no. *"><input value={form.batch_no} onChange={set("batch_no")} required maxLength={60} /></Field>
          <Field label="Expiry date *"><input type="date" value={form.expiry_date} onChange={set("expiry_date")} required /></Field>
          <Field label="Quantity *"><input type="number" min="1" step="1" value={form.qty_received} onChange={set("qty_received")} required /></Field>
          <Field label="Purchase price / unit (₹)"><input type="number" min="0" step="0.01" value={form.purchase_price} onChange={set("purchase_price")} /></Field>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn">Save batch</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {!data ? <p>Loading…</p> : data.batches.length === 0 ? <Empty>No batches yet.</Empty> : (
        <table className="tbl box"><thead><tr><th>Product</th><th>Batch</th><th>Expiry</th><th>Available</th></tr></thead><tbody>
          {data.batches.map((b) => { const [t, cls] = st(b.days_left); return <tr key={b.id}><td>{b.product}</td><td>{b.batch_no}</td><td>{b.expiry_date} <span className={cls}>{t}</span></td><td>{b.qty_available} <span className="muted">/ {b.qty_received}</span></td></tr>; })}
        </tbody></table>
      )}
    </div>
  );
}

export function SellerOrders() {
  const { data, err, reload } = useLoad("/api/seller/orders");
  const [inv, setInv] = useState({});
  const pack = async (o) => {
    try { await api(`/api/seller/orders/${o.id}/pack`, "POST", { invoice_no: inv[o.id] || "" }); reload(); } catch (x) { alert(x.message); }
  };
  return (
    <div>
      <div className="bar"><h1>Orders to pack</h1></div>
      <p className="muted">Only paid orders appear. Pack the exact batch shown, enclose your tax invoice, then mark packed — Veda then arranges courier pickup.</p>
      {err && <p className="bad">{err}</p>}
      {!data ? <p>Loading…</p> : data.orders.length === 0 ? <Empty>No orders yet.</Empty> : data.orders.map((o) => (
        <div className="box" key={o.id}>
          <div className="row" style={{ justifyContent: "space-between" }}><b>{o.order_no}</b><span><Status s={o.packed ? "approved" : "pending"} /> <span className="muted">{o.packed ? "packed" : "to pack"} · {o.status.replace(/_/g, " ")}</span></span></div>
          <div className="muted">{fmtDate(o.created_at)} · {o.city}</div>
          <table className="tbl"><tbody>{o.items.map((i, n) => <tr key={n}><td>{i.name}<div className="muted">Batch {i.batch || "—"}{i.expiry ? ` · exp ${i.expiry}` : ""}</div></td><td className="r">{i.qty} × {inrA(i.price)}</td></tr>)}
            <tr><td><b>Your items total</b></td><td className="r"><b>{inrA(o.my_total)}</b></td></tr></tbody></table>
          {o.packed ? <p className="muted">Invoice no. {o.invoice_no}</p> : (
            <div className="row" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <input placeholder={`Invoice no. (auto: INV-${o.order_no})`} value={inv[o.id] || ""} onChange={(e) => setInv({ ...inv, [o.id]: e.target.value })} maxLength={40} style={{ flex: "1 1 220px" }} />
              <button className="btn" onClick={() => pack(o)}>Mark packed</button>
            </div>)}
        </div>
      ))}
    </div>
  );
}

export function SellerEarnings() {
  const { data: d, err } = useLoad("/api/seller/earnings");
  if (err) return <p className="bad">{err}</p>;
  if (!d) return <p>Loading…</p>;
  return (
    <div>
      <div className="bar"><h1>Earnings & settlements</h1></div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap", justifyContent: "flex-start" }}>
        <Stat k="Delivered sales" v={inrA(d.gross)} /><Stat k={`Commission (${d.commission_percent}%)`} v={"−" + inrA(d.commission)} /><Stat k="Net earnings" v={inrA(d.net)} /><Stat k="Balance to receive" v={inrA(d.balance)} />
      </div>
      <h3 style={{ margin: "16px 0 6px" }}>Payouts received</h3>
      {d.payouts.length === 0 ? <Empty>No payouts yet. Veda settles delivered orders to your bank account.</Empty> : (
        <table className="tbl box"><thead><tr><th>Date</th><th>Reference</th><th className="r">Amount</th></tr></thead><tbody>
          {d.payouts.map((p, n) => <tr key={n}><td>{fmtDate(p.created_at)}</td><td>{p.reference || "—"}{p.note ? <div className="muted">{p.note}</div> : null}</td><td className="r">{inrA(p.amount)}</td></tr>)}
        </tbody></table>
      )}
    </div>
  );
}
