"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";

export default function AccountClient() {
  const { t, user, authEnabled, refreshUser, lang } = useApp();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  // wait for the first /api/auth/me result before deciding to redirect
  useEffect(() => { const id = setTimeout(() => setLoaded(true), 800); return () => clearTimeout(id); }, []);
  useEffect(() => { if (user) { setName(user.name || ""); setEmail(user.email || ""); setLoaded(true); } }, [user]);
  useEffect(() => { if (loaded && !user) router.replace(authEnabled ? "/login?next=/account" : "/"); }, [loaded, user, authEnabled, router]);

  if (!user) return <div className="container empty" />;

  const save = async (e) => {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, language: lang }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setMsg(t("saved")); refreshUser(); } else setMsg(j.error || "Error");
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshUser();
    router.replace("/");
  };

  return (
    <div className="container">
      <div className="acc">
        <h1>{t("welcome")}{user.name ? `, ${user.name}` : ""}</h1>
        <form className="box f" onSubmit={save}>
          <h2>{t("account")}</h2>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>{user.phone}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("yourName")} maxLength={120} aria-label={t("yourName")} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} type="email" maxLength={160} aria-label={t("email")} />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn">{t("save")}</button>
            {msg && <span className="ok">{msg}</span>}
          </div>
        </form>
        <div className="box"><h2>{t("orders")}</h2><p style={{ color: "var(--muted)" }}>{t("noOrders")}</p></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {user.role === "admin" && <Link href="/admin" className="btn">{t("adminPanel")}</Link>}
          <button className="btn ghost" onClick={logout}>{t("logout")}</button>
        </div>
      </div>
    </div>
  );
}
