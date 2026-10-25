import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth/session";
import { hasDb } from "../../lib/db";
import { sellerOf } from "../../lib/seller";
import AdminShell from "../../components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller panel", robots: { index: false, follow: false } };

const NAV = [["/seller", "Dashboard", "grid"], ["/seller/orders", "Orders to pack", "cart"], ["/seller/products", "My listings", "list"], ["/seller/inventory", "Stock & batches", "box"], ["/seller/earnings", "Earnings", "card"]];

export default async function SellerLayout({ children }) {
  if (!hasDb()) return <div className="container"><div className="page"><h1>Seller panel</h1><p>Database is not configured yet.</p></div></div>;
  const user = await getUser();
  if (!user) redirect("/login?next=/seller");
  const s = await sellerOf(user.id);
  if (!s) redirect("/sell");
  if (s.status !== "approved") {
    const msg = { pending: "Your application is under review. We verify your licence, premises, pharmacist and identity documents before approval.", rejected: "Your application was not approved.", suspended: "Your seller account is suspended." }[s.status];
    return <div className="container"><div className="page"><h1>{s.business_name}</h1><p>Status: <b>{s.status}</b></p><p>{msg}</p>{s.admin_note && <p className="muted">Note from Veda: {s.admin_note}</p>}<p><Link href="/" className="link-btn">Back to store</Link></p></div></div>;
  }
  return <AdminShell user={{ name: s.business_name, phone: user.phone }} nav={NAV} home="/seller" label="Seller portal">{children}</AdminShell>;
}
