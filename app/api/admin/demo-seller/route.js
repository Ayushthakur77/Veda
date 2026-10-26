import { adminRoute } from "../../../../lib/admin";
import { one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// Testing aid: gives the logged-in admin an approved demo seller profile so /seller can be opened without applying.
export const POST = adminRoute(async ({ admin }) => {
  const s = await one(`
    INSERT INTO sellers (user_id, business_name, owner_name, phone, premises_address, city, pincode, status, checks, commission_percent, admin_note, agreement_accepted_at, approved_at)
    VALUES ($1, 'Demo Seller (test)', $2, $3, 'Demo premises, Delhi', 'Delhi', '110001', 'approved', '{"identity":true,"premises":true,"bank":true,"demo":true}'::jsonb, 10, 'Demo seller created by admin for testing', now(), now())
    ON CONFLICT (user_id) DO UPDATE SET status = CASE WHEN sellers.status IN ('rejected','suspended') AND sellers.checks->>'demo' = 'true' THEN 'approved' ELSE sellers.status END
    RETURNING id, status`,
    [admin.id, admin.name || "Admin", String(admin.phone || "9000000000").replace(/\D/g, "").slice(-10) || "9000000000"]);
  return { ok: true, status: s.status };
}, { write: true });
