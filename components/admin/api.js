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
