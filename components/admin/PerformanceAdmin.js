"use client";
import { useState } from "react";
import { useLoad, inrA, Empty } from "./api";

export default function PerformanceAdmin() {
  const [days, setDays] = useState(30);
  const { data, err } = useLoad(`/api/admin/performance?days=${days}`);
  const k = data?.kpi;
  const max = data ? Math.max(1, ...data.daily.map((d) => d.revenue)) : 1;
  return (
    <div>
      <div className="bar"><h1>Performance</h1>
        <select className="adm-search" style={{ maxWidth: 160 }} value={days} onChange={(e) => setDays(+e.target.value)}>{[7, 30, 90, 180].map((d) => <option key={d} value={d}>Last {d} days</option>)}</select></div>
      {err && <p className="bad">{err}</p>}
      {k && <>
        <div className="tiles">{[["Orders", k.orders], ["Revenue", inrA(k.revenue)], ["Avg order value", inrA(k.aov)], ["Customers", k.customers], ["Delivered", k.deliveredRate + "%"], ["Cancelled", k.cancelRate + "%", k.cancelRate > 10], ["Returned", k.returnRate + "%", k.returnRate > 5]].map(([l, v, w]) => <div key={l} className={"tile" + (w ? " warn" : "")}><b>{v}</b><span>{l}</span></div>)}</div>
        <section className="box"><h2>Daily revenue</h2>
          {k.orders === 0 ? <p className="muted">No orders in this period yet.</p> : <div className="bars" role="img" aria-label="Daily revenue">{data.daily.map((d) => <div key={d.day} title={`${d.day}: ${inrA(d.revenue)} · ${d.orders} orders`} style={{ height: Math.max(2, (d.revenue / max) * 100) + "%" }} />)}</div>}
        </section>
        <section className="box"><h2>Top products</h2>
          {data.top.length === 0 ? <p className="muted">No sales yet.</p> : <table className="tbl"><tbody>{data.top.map((t) => <tr key={t.name}><td>{t.name}</td><td className="r">{t.units} units</td><td className="r">{inrA(t.revenue)}</td></tr>)}</tbody></table>}
        </section>
      </>}
    </div>
  );
}
