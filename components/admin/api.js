"use client";
import { useCallback, useEffect, useState } from "react";

export async function api(url, method = "GET", body) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

export function useLoad(url) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const reload = useCallback(async () => {
    try { setData(await api(url)); setErr(""); } catch (e) { setErr(e.message); }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { data, err, reload };
}

export const inrA = (n) => "₹" + Number(n).toLocaleString("en-IN");

export function Field({ label, children, wide }) {
  return <label className={"fld" + (wide ? " wide" : "")}><span>{label}</span>{children}</label>;
}

export const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const TONE = { delivered: "ok", paid: "ok", captured: "ok", refunded: "ok", resolved: "ok", approved: "ok", cancelled: "bad", failed: "bad", rejected: "bad", returned: "warn", high: "bad", open: "warn", requested: "warn", pending: "warn2", created: "warn2", placed: "warn2" };
export const Status = ({ s }) => <span className={"pill " + (TONE[s] || "")}>{String(s).replace(/_/g, " ")}</span>;
export const Empty = ({ children }) => <div className="box"><p className="muted" style={{ textAlign: "center", padding: "18px 0" }}>{children}</p></div>;
