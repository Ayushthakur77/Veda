"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "./Providers";

const safeNext = (n) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export default function LoginClient() {
  const { t, authEnabled, user, refreshUser, googleClientId, lang } = useApp();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dev, setDev] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const gbtn = useRef(null);
  useEffect(() => {
    if (!googleClientId || step !== "phone") return;
    let dead = false;
    const init = () => {
      if (dead || !window.google?.accounts?.id || !gbtn.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp) => {
          setErr(""); setBusy(true);
          const r = await post("/api/auth/google", { credential: resp.credential }).catch(() => ({ ok: false }));
          if (!r.ok) { setBusy(false); return setErr(r.error || t("googleError")); }
          await refreshUser(); router.replace(next);
        },
      });
      window.google.accounts.id.renderButton(gbtn.current, { theme: "outline", size: "large", width: 300, text: "continue_with", locale: lang });
    };
    if (window.google?.accounts?.id) init();
    else {
      let s = document.getElementById("gsi-client");
      if (!s) { s = document.createElement("script"); s.id = "gsi-client"; s.src = "https://accounts.google.com/gsi/client"; s.async = true; document.body.appendChild(s); }
      s.addEventListener("load", init);
      return () => { dead = true; s.removeEventListener("load", init); };
    }
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, step, lang]);

  const post = async (url, body) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, ...j };
  };

  const send = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    const r = await post("/api/auth/send-otp", { phone });
    setBusy(false);
    if (!r.ok) { if (r.retryAfter) setWait(r.retryAfter); return setErr(r.error || "Something went wrong."); }
    setDev(r.devOtp || ""); setStep("otp"); setWait(30);
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await post("/api/auth/verify-otp", { phone, code });
    if (!r.ok) { setBusy(false); return setErr(r.error || "Something went wrong."); }
    await refreshUser();
    router.replace(next);
  };

  if (!authEnabled) return <div className="container"><div className="page"><h1>{t("login")}</h1><p>{t("loginDisabled")}</p></div></div>;

  return (
    <div className="container">
      <div className="authbox">
        <h1>{t("login")}</h1>
        {step === "phone" ? (
          <form onSubmit={send}>
            <label htmlFor="ph">{t("mobile")}</label>
            <div className="phone-row"><span>+91</span>
              <input id="ph" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="9876543210" autoFocus />
            </div>
            {err && <p className="bad" role="alert">{err}</p>}
            <button className="btn" disabled={busy || phone.length !== 10}>{t("sendOtp")}</button>
            {googleClientId && <><div className="or-line"><span>{t("orWord")}</span></div><div ref={gbtn} className="gbtn" /></>}
          </form>
        ) : (
          <form onSubmit={verify}>
            <p style={{ color: "var(--muted)" }}>{t("otpSent")} +91 {phone}</p>
            <label htmlFor="otp">{t("enterOtp")}</label>
            <input id="otp" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
            {dev && <p className="devotp">Test mode OTP: <b>{dev}</b></p>}
            {err && <p className="bad" role="alert">{err}</p>}
            <button className="btn" disabled={busy || code.length !== 6}>{t("verify")}</button>
            <div className="auth-links">
              <button type="button" className="link-btn" onClick={() => { setStep("phone"); setCode(""); setErr(""); setDev(""); }}>{t("changeNumber")}</button>
              <button type="button" className="link-btn" disabled={wait > 0 || busy} onClick={send}>{t("resend")}{wait > 0 ? ` (${wait})` : ""}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
