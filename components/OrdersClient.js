"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";
import { inr } from "../lib/format";
import { Illus } from "./Icons";

const label = (s) => s.replace(/_/g, " ");
const STEPS = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

export function useAuthed(next) {
  const { user, authEnabled } = useApp();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const id = setTimeout(() => setLoaded(true), 800); return () => clearTimeout(id); }, []);
  useEffect(() => { if (user) setLoaded(true); }, [user]);
  useEffect(() => { if (loaded && !user) router.replace(authEnabled ? `/login?next=${next}` : "/"); }, [loaded, user, authEnabled, router, next]);
  return user;
}

export function OrdersList() {
  const { t } = useApp();
  const user = useAuthed("/orders");
  const [rows, setRows] = useState(null);
  useEffect(() => { if (user) fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()).then((j) => setRows(j.rows || [])).catch(() => setRows([])); }, [user]);
  if (!user || !rows) return <div className="container empty" />;
  return (
    <div className="container">
      <div className="sec-head" style={{ marginTop: 24 }}><h2>{t("myOrders")}</h2></div>
      {rows.length === 0 ? <div className="empty"><p>{t("noOrders")}</p><Link href="/" className="btn">{t("continueShopping")}</Link></div> :
        rows.map((o) => (
          <Link key={o.order_no} href={`/orders/${o.order_no}`} className="ordercard">
            <div><b>{o.order_no}</b><div className="muted">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div><div className="muted clip">{o.items}</div></div>
            <div style={{ textAlign: "right" }}><b>{inr(o.total)}</b><div><span className="chip">{label(o.status)}</span></div></div>
          </Link>
        ))}
    </div>
  );
}

export function OrderDetail({ no, fresh }) {
  const { t } = useApp();
  const user = useAuthed(`/orders/${no}`);
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { if (user) fetch(`/api/orders/${encodeURIComponent(no)}`, { cache: "no-store" }).then(async (r) => { const j = await r.json(); r.ok ? setD(j) : setErr(j.error); }).catch(() => setErr("Error")); }, [user, no]);
  if (!user) return <div className="container empty" />;
  if (err) return <div className="container empty"><p>{err}</p><Link href="/orders" className="btn">{t("myOrders")}</Link></div>;
  if (!d) return <div className="container empty" />;
  const o = d.order; const idx = STEPS.indexOf(o.status); const a = o.address_snapshot || {};
  return (
    <div className="container">
      <div className="page" style={{ maxWidth: 720 }}>
        {fresh && <div className="okbox"><Illus color name="check" size={64} /><div><b>{t("orderPlaced")}</b><div>{t("orderThanks")}</div></div></div>}
        <h1>{t("orderNo")} {o.order_no}</h1>
        <p><span className="chip">{label(o.status)}</span> <span className="chip">{t("payment")}: {o.payment_method === "cod" ? (o.payment_status === "paid" ? "Cash on Delivery · paid" : "Cash on Delivery · pay ₹" + o.total + " on delivery") : o.payment_status}</span>{o.status !== "cancelled" && <> <Link href={`/invoice/${o.order_no}`} className="chip" style={{ textDecoration: "underline" }}>{t("invoice") || "Download invoice"}</Link></>}</p>
        {o.status === "cancelled" ? <p className="bad">{o.cancel_reason}</p> : o.status !== "returned" && (
          <ol className="steps">{STEPS.map((s, i) => <li key={s} className={i <= idx ? "on" : ""}>{label(s)}</li>)}</ol>
        )}
        {d.shipment && <p>{d.shipment.courier_name} · {d.shipment.tracking_url ? <a href={d.shipment.tracking_url} target="_blank" rel="noreferrer noopener" style={{ color: "var(--green)", fontWeight: 600 }}>{d.shipment.awb_code} ({t("trackOrder")})</a> : d.shipment.awb_code}</p>}
        <h2>{t("cart")}</h2>
        {d.items.map((i, n) => <div className="row" key={n} style={{ display: "flex", justifyContent: "space-between" }}><span>{i.name} × {i.qty}</span><span>{inr(i.unit * i.qty)}</span></div>)}
        <div className="row" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}><span>{t("shipping")}</span><span>{o.shipping_fee ? inr(o.shipping_fee) : t("free")}</span></div>
        <div className="row" style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>{t("total")}</span><span>{inr(o.total)}</span></div>
        <h2>{t("deliveryAddress")}</h2>
        <p>{a.full_name} · {a.phone}<br />{[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.pincode}</p>
      </div>
    </div>
  );
}
