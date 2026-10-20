"use client";
import { useState } from "react";
import { api, useLoad, Field, inrA } from "./api";

const blank = { name_en: "", name_hi: "", sku: "", slug: "", category_id: "", product_type: "ayurvedic", pack_size: "", mrp: "", selling_price: "", gst_percent: 12, hsn_code: "", supply_source: "own", image_url: "", description_en: "", description_hi: "", ingredients: "", usage_info: "", is_active: true };

export default function ProductsAdmin() {
  const { data, err, reload } = useLoad("/api/admin/products");
  const cats = useLoad("/api/admin/categories");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg("");
    try { await api(form.id ? `/api/admin/products/${form.id}` : "/api/admin/products", form.id ? "PUT" : "POST", form); setForm(null); reload(); }
    catch (x) { setMsg(x.message); }
  };
  const toggle = async (p) => {
    try { await api(`/api/admin/products/${p.id}`, "PUT", { ...p, is_active: !p.is_active }); reload(); } catch (x) { alert(x.message); }
  };
  const list = (data?.products || []).filter((p) => !q || (p.name_en + " " + p.sku).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="bar"><h1>Products</h1><button className="btn" onClick={() => setForm({ ...blank })}>+ Add product</button></div>
      {err && <p className="bad">{err}</p>}
      {form && (
        <form className="box grid2" onSubmit={save}>
          <Field label="Name (English) *"><input value={form.name_en} onChange={set("name_en")} required maxLength={200} /></Field>
          <Field label="Name (Hindi)"><input value={form.name_hi || ""} onChange={set("name_hi")} maxLength={200} /></Field>
          <Field label="SKU (auto if empty)"><input value={form.sku} onChange={set("sku")} maxLength={60} /></Field>
          <Field label="Slug (auto if empty)"><input value={form.slug} onChange={set("slug")} maxLength={200} /></Field>
          <Field label="Category"><select value={form.category_id ?? ""} onChange={set("category_id")}><option value="">—</option>{(cats.data?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></Field>
          <Field label="Type *"><select value={form.product_type} onChange={set("product_type")}><option value="ayurvedic">Ayurvedic</option><option value="homeopathy">Homeopathy</option><option value="healthcare">Healthcare</option></select></Field>
          <Field label="Pack size"><input value={form.pack_size || ""} onChange={set("pack_size")} placeholder="60 capsules" maxLength={60} /></Field>
          <Field label="Supply"><select value={form.supply_source} onChange={set("supply_source")}><option value="own">Own stock</option><option value="distributor">Distributor</option></select></Field>
          <Field label="MRP (₹) *"><input type="number" step="0.01" min="0.01" value={form.mrp} onChange={set("mrp")} required /></Field>
          <Field label="Selling price (₹) *"><input type="number" step="0.01" min="0.01" value={form.selling_price} onChange={set("selling_price")} required /></Field>
          <Field label="GST %"><input type="number" step="0.01" min="0" max="28" value={form.gst_percent} onChange={set("gst_percent")} /></Field>
          <Field label="HSN code"><input value={form.hsn_code || ""} onChange={set("hsn_code")} maxLength={10} /></Field>
          <Field label="Image URL (https)" wide><input value={form.image_url || ""} onChange={set("image_url")} placeholder="https://…" maxLength={1000} /></Field>
          <Field label="Description (English)" wide><textarea rows={2} value={form.description_en || ""} onChange={set("description_en")} /></Field>
          <Field label="Description (Hindi)" wide><textarea rows={2} value={form.description_hi || ""} onChange={set("description_hi")} /></Field>
          <Field label="Ingredients" wide><textarea rows={2} value={form.ingredients || ""} onChange={set("ingredients")} /></Field>
          <Field label="Usage info" wide><textarea rows={2} value={form.usage_info || ""} onChange={set("usage_info")} /></Field>
          <Field label="Visible in store"><input type="checkbox" checked={form.is_active} onChange={set("is_active")} /></Field>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn">Save</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      <input className="adm-search" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      {!data ? <p>Loading…</p> : (
        <table className="tbl box"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p.id}><td>{p.name_en}<div className="muted">{p.sku} · {p.pack_size}</div></td><td>{p.category || "—"}</td>
              <td>{inrA(p.selling_price)} <span className="muted"><s>{inrA(p.mrp)}</s></span></td>
              <td>{p.batches ? p.stock : <span className="muted">not tracked</span>}</td>
              <td>{p.is_active ? <span className="pill ok">Live</span> : <span className="pill">Hidden</span>}</td>
              <td className="r"><button className="link-btn" onClick={() => setForm({ ...p, category_id: p.category_id ?? "" })}>Edit</button> · <button className="link-btn" onClick={() => toggle(p)}>{p.is_active ? "Hide" : "Show"}</button></td></tr>))}
            {list.length === 0 && <tr><td colSpan={6} className="muted">No products.</td></tr>}</tbody></table>
      )}
    </div>
  );
}
