// OTP delivery. OTP_PROVIDER=mock (default) | msg91
export const isMock = () => (process.env.OTP_PROVIDER || "mock") === "mock";

export async function sendOtpSms(phone, code) {
  const provider = process.env.OTP_PROVIDER || "mock";
  if (provider === "mock") {
    console.log(`[OTP mock] ${phone} -> ${code}`);
    return;
  }
  if (provider === "msg91") {
    const { MSG91_AUTH_KEY, MSG91_TEMPLATE_ID } = process.env;
    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) throw new Error("MSG91_AUTH_KEY / MSG91_TEMPLATE_ID not set");
    const u = new URL("https://control.msg91.com/api/v5/otp");
    u.searchParams.set("template_id", MSG91_TEMPLATE_ID);
    u.searchParams.set("mobile", phone.replace("+", ""));
    u.searchParams.set("authkey", MSG91_AUTH_KEY);
    u.searchParams.set("otp", code);
    u.searchParams.set("otp_expiry", "5");
    const res = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.type === "error") throw new Error("MSG91 error: " + (body.message || res.status));
    return;
  }
  throw new Error("Unknown OTP_PROVIDER: " + provider);
}
