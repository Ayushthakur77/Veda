import { NextResponse } from "next/server";
import { getUser } from "./auth/session";
import { hasDb, one } from "./db";
import { fail, readJson } from "./http";
import { Invalid } from "./admin";

export const sellerOf = async (userId) => one(`SELECT * FROM sellers WHERE user_id = $1`, [userId]);

// Wraps a seller route: needs a logged-in user with an APPROVED seller profile.
export function sellerRoute(handler, { write = false } = {}) {
  return async (req, ctx) => {
    if (!hasDb()) return fail("Database is not configured.", 503);
    const user = await getUser();
    if (!user) return fail("Please log in.", 401);
    const seller = await sellerOf(user.id);
    if (!seller || seller.status !== "approved") return fail("Seller account is not approved.", 403);
    let body = null;
    if (write && req.method !== "DELETE") { body = await readJson(req); if (!body) return fail("Invalid request body.", 415); }
    try {
      const out = await handler({ req, params: ctx?.params ?? {}, body, seller, user });
      return out instanceof NextResponse ? out : NextResponse.json(out);
    } catch (e) {
      if (e.code === "23505") return fail("That value already exists (duplicate SKU, slug or batch).", 409);
      if (e.userMessage) return fail(e.userMessage, 400);
      console.error("[seller]", req.method, req.url, e);
      return fail("Server error.", 500);
    }
  };
}

export const REQUIRED_CHECKS = (s) => ["identity", "premises", "bank", ...(s.seller_type === "pharmacy" ? ["licence", "pharmacist"] : [])];

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function cleanApplication(b) {
  const t = (v, m = 200) => (typeof v === "string" ? v.trim().slice(0, m) : "");
  const up = (v, m) => t(v, m).toUpperCase().replace(/\s+/g, "");
  const a = {
    business_name: t(b.business_name, 160), owner_name: t(b.owner_name, 120), phone: t(b.phone, 15).replace(/\D/g, "").slice(-10),
    email: t(b.email, 160) || null, gstin: up(b.gstin, 15) || null, pan: up(b.pan, 10) || null,
    seller_type: b.seller_type === "pharmacy" ? "pharmacy" : "ayush",
    drug_licence_no: t(b.drug_licence_no, 60) || null, licence_expiry: t(b.licence_expiry, 10) || null,
    pharmacist_name: t(b.pharmacist_name, 120) || null, pharmacist_reg_no: t(b.pharmacist_reg_no, 60) || null,
    premises_address: t(b.premises_address, 500), city: t(b.city, 80), pincode: t(b.pincode, 6),
    bank_holder: t(b.bank_holder, 120), bank_account_no: t(b.bank_account_no, 24).replace(/\D/g, ""), bank_ifsc: up(b.bank_ifsc, 11),
  };
  if (!a.business_name || !a.owner_name) throw new Invalid("Business name and owner name are required.");
  if (!/^[6-9]\d{9}$/.test(a.phone)) throw new Invalid("Enter a valid 10-digit mobile number.");
  if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) throw new Invalid("Enter a valid email.");
  if (!a.premises_address || !a.city || !/^\d{6}$/.test(a.pincode)) throw new Invalid("Full premises address, city and a 6-digit pincode are required.");
  if (!a.gstin && !a.pan) throw new Invalid("GSTIN or PAN is required for legal identity.");
  if (a.gstin && !GSTIN.test(a.gstin)) throw new Invalid("GSTIN format looks wrong.");
  if (a.pan && !PAN.test(a.pan)) throw new Invalid("PAN format looks wrong (e.g. ABCDE1234F).");
  if (!a.bank_holder || !/^\d{9,18}$/.test(a.bank_account_no) || !IFSC.test(a.bank_ifsc)) throw new Invalid("Valid bank account holder, account number and IFSC are required for settlement.");
  if (a.seller_type === "pharmacy") {
    if (!a.drug_licence_no || !a.pharmacist_name || !a.pharmacist_reg_no) throw new Invalid("Pharmacy sellers must give drug licence no., registered pharmacist name and registration no.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.licence_expiry || "") || Number.isNaN(Date.parse(a.licence_expiry))) throw new Invalid("Enter the drug licence expiry date.");
    if (new Date(a.licence_expiry) <= new Date()) throw new Invalid("Drug licence has expired.");
  } else a.licence_expiry = /^\d{4}-\d{2}-\d{2}$/.test(a.licence_expiry || "") ? a.licence_expiry : null;
  if (b.agree !== true) throw new Invalid("Please accept the Seller Agreement.");
  return a;
}
