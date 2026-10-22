"use client";
import Link from "next/link";
import { useLoad } from "./api";

function Card({ title, hint, rows, render, href }) {
  return (
    <section className="box"><h2>{title} <span className="muted">({rows.length})</span></h2><p className="muted">{hint}</p>
      {rows.length === 0 ? <p className="ok" style={{ marginTop: 8 }}>✓ All good</p> : <table className="tbl"><tbody>{rows.map((r, i) => <tr key={i}>{render(r)}</tr>)}</tbody></table>}
      {href && rows.length > 0 && <p style={{ marginTop: 8 }}><Link href={href} className="link-btn">Open</Link></p>}
    </section>
  );
}

export default function OpportunitiesAdmin() {
  const { data, err } = useLoad("/api/admin/opportunities");
  if (err) return <p className="bad">{err}</p>;
  if (!data) return <p>Loading…</p>;
  const nm = (r) => <td>{r.name_en}<div className="muted">{r.sku}</div></td>;
  return (
    <div>
      <h1>Opportunities</h1>
      <p className="muted">Quick wins to sell more and waste less.</p>
      <div className="two">
        <Card title="Out of stock" hint="Restock these — customers can't order them." rows={data.outOfStock} render={nm} href="/admin/inventory" />
        <Card title="Expiring in 90 days" hint="Run a discount or a deal before these expire." rows={data.expiring} render={(r) => <><td>{r.name_en}<div className="muted">Batch {r.batch_no} · {r.qty_available} units</div></td><td className="r">{r.days_left} days<div className="muted">{r.expiry_date}</div></td></>} href="/admin/inventory" />
        <Card title="Best sellers (30 days)" hint="Keep these well stocked." rows={data.hotLowStock} render={(r) => <><td>{r.name}</td><td className="r">{r.sold_30d} sold</td></>} />
        <Card title="Products without an image" hint="Listings with photos convert better." rows={data.noImage} render={nm} href="/admin/products" />
        <Card title="Short descriptions" hint="Add a clear description (30+ characters)." rows={data.noDesc} render={nm} href="/admin/products" />
        <Card title="Discounted but no deal" hint="Add the biggest discounts to Deals of the Day." rows={data.noDeal} render={(r) => <td>{r.name_en}</td>} />
      </div>
    </div>
  );
}
