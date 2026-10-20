import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { tx } from "../db";
import { authSecret } from "./secret";
import { sendOtpSms } from "./sms";

const TTL_MIN = 5, MAX_ATTEMPTS = 5, MAX_SENDS_PER_10_MIN = 3, COOLDOWN_SEC = 30;

const hash = (phone, code) => createHmac("sha256", authSecret()).update(`${phone}:${code}`).digest("hex");

// Returns { ok:true, code } or { ok:false, error, status, retryAfter? }
export async function issueOtp(phone) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const res = await tx(async (c) => {
    // serialise concurrent requests for the same phone
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [phone]);
    const { rows } = await c.query(
      `SELECT count(*)::int AS n,
              coalesce(min(EXTRACT(EPOCH FROM (now() - (expires_at - interval '${TTL_MIN} minutes')))), 1e9) AS last_age
       FROM otp_codes WHERE phone = $1 AND expires_at > now() - interval '${TTL_MIN} minutes'`, [phone]);
    const { n, last_age } = rows[0];
    if (Number(last_age) < COOLDOWN_SEC) return { ok: false, status: 429, error: "Please wait a few seconds before requesting another OTP.", retryAfter: Math.ceil(COOLDOWN_SEC - Number(last_age)) };
    if (n >= MAX_SENDS_PER_10_MIN) return { ok: false, status: 429, error: "Too many OTP requests. Try again in a few minutes." };
    await c.query("UPDATE otp_codes SET used = TRUE WHERE phone = $1 AND used = FALSE", [phone]);
    await c.query(`INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, now() + interval '${TTL_MIN} minutes')`, [phone, hash(phone, code)]);
    return { ok: true };
  });
  if (!res.ok) return res;
  try {
    await sendOtpSms(phone, code);
  } catch (e) {
    console.error("OTP send failed:", e.message);
    return { ok: false, status: 502, error: "Could not send OTP. Please try again." };
  }
  return { ok: true, code };
}

// Returns { ok:true } or { ok:false, error }
export async function checkOtp(phone, code) {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit OTP." };
  return tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [phone]);
    const { rows } = await c.query(
      "SELECT id, code_hash, attempts FROM otp_codes WHERE phone = $1 AND used = FALSE AND expires_at > now() ORDER BY id DESC LIMIT 1 FOR UPDATE", [phone]);
    const row = rows[0];
    if (!row) return { ok: false, error: "OTP expired or not requested. Please request a new one." };
    if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many wrong attempts. Please request a new OTP." };
    const a = Buffer.from(row.code_hash, "hex"), b = Buffer.from(hash(phone, code), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await c.query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1", [row.id]);
      return { ok: false, error: "Incorrect OTP." };
    }
    await c.query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [row.id]);
    return { ok: true };
  });
}
