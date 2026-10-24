"use client";
import { useState } from "react";
import { api, useLoad, Field } from "./api";

const blank = { name_en: "", name_hi: "", slug: "", emoji: "", sort_order: 0, is_active: true };

export default function CategoriesAdmin() {
  const { data, err, reload } = useLoad("/api/admin/categories");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg("");
    try { await api(form.id ? `/api/admin/categories/${form.id}` : "/api/admin/categories", form.id ? "PUT" : "POST", form); setForm(null); reload(); }
    catch (x) { setMsg(x.message); }
  };
  const del = async (c) => {
    if (!confirm(`Delete category "${c.name_en}"?`)) return;
    try { await api(`/api/admin/categories/${c.id}`, "DELETE"); reload(); } catch (x) { alert(x.message); }
  };

  return (
    <div>
      <div className="bar"><h1>Categories</h1><button className="btn" onClick={() => setForm({ ...blank })}>+ Add category</button></div>
      {err && <p className="bad">{err}</p>}
      {form && (
        <form className="box grid2" onSubmit={save}>
          <Field label="Name (English) *"><input value={form.name_en} onChange={set("name_en")} required maxLength={120} /></Field>
          <Field label="Name (Hindi)"><input value={form.name_hi || ""} onChange={set("name_hi")} maxLength={120} /></Field>
          <Field label="Slug (auto if empty)"><input value={form.slug} onChange={set("slug")} maxLength={120} /></Field>
          <Field label="Sort order"><input type="number" value={form.sort_order} onChange={set("sort_order")} /></Field>
          <Field label="Active"><input type="checkbox" checked={form.is_active} onChange={set("is_active")} /></Field>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn">Save</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {!data ? <p>Loading…</p> : (
        <table className="tbl box"><thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Status</th><th></th></tr></thead>
          <tbody>{data.categories.map((c) => (
            <tr key={c.id}><td>{c.name_en}<div className="muted">{c.name_hi}</div></td><td className="muted">{c.slug}</td><td>{c.product_count}</td>
              <td>{c.is_active ? <span className="pill ok">Active</span> : <span className="pill">Hidden</span>}</td>
              <td className="r"><button className="link-btn" onClick={() => setForm(c)}>Edit</button> · <button className="link-btn" onClick={() => del(c)}>Delete</button></td></tr>))}</tbody></table>
      )}
    </div>
  );
}
