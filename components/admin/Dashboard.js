"use client";
import Link from "next/link";
import { useLoad, inrA } from "./api";

export default function Dashboard() {
  const { data, err } = useLoad("/api/admin/stats");
  if (err) return <p className="bad">{err}</p>;
  if (!data) return <p>Loading…</p>;
  const c = data.counts;
  const ops = [["New orders", c.new_orders, "/admin/orders", c.new_orders > 0], ["To ship", c.to_ship, "/admin/orders", c.to_ship > 0], ["In transit", c.in_transit, "/admin/track"], ["Open returns", c.open_returns, "/admin/returns", c.open_returns > 0], ["Open issues", c.open_issues, "/admin/issues", c.open_issues > 0], ["Today's revenue", inrA(c.today_revenue), "/admin/performance"]];
  const tiles = [["Active products", c.products], ["Categories", c.categories], ["Customers", c.customers], ["Expiring in 60 days", c.expiring_60, c.expiring_60 > 0], ["Expired (still in stock)", c.expired_batches, c.expired_batches > 0]];
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="tiles">{ops.map(([l, v, h, warn]) => <Link key={l} href={h} className={"tile" + (warn ? " warn" : "")}><b>{v}</b><span>{l}</span></Link>)}</div>
      <div className="tiles" style={{ marginTop: 12 }}>{tiles.map(([l, v, warn]) => <div key={l} className={"tile" + (warn ? " warn" : "")}><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="two">
        <section className="box"><h2>Low stock (≤ 10)</h2>
          {data.low.length === 0 ? <p className="muted">Nothing low. (Stock is tracked only for products with batches.)</p> :
            <table className="tbl"><tbody>{data.low.map((r) => <tr key={r.id}><td>{r.name_en}</td><td className="r">{r.stock} left</td></tr>)}</tbody></table>}
        </section>
        <section className="box"><h2>Expiring soon / expired</h2>
          {data.expiring.length === 0 ? <p className="muted">No batches expiring in the next 60 days.</p> :
            <table className="tbl"><tbody>{data.expiring.map((r, i) => <tr key={i}><td>{r.name_en}<div className="muted">Batch {r.batch_no} · {r.qty_available} units</div></td>
              <td className={"r " + (r.days_left <= 0 ? "bad" : "")}>{r.days_left <= 0 ? "EXPIRED" : r.days_left + " days"}<div className="muted">{r.expiry_date}</div></td></tr>)}</tbody></table>}
        </section>
      </div>
      <p className="muted">Next: <Link href="/admin/products" className="link-btn">add your products</Link>, then record batches under Inventory.</p>
    </div>
  );
}
