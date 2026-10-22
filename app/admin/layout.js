import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth/session";
import { hasDb } from "../../lib/db";
import AdminShell from "../../components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  if (!hasDb()) return <div className="container"><div className="page"><h1>Admin</h1><p>Database is not configured yet (set DATABASE_URL).</p></div></div>;
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") return <div className="container"><div className="page"><h1>Not allowed</h1><p>This account does not have admin access.</p><p><Link href="/" className="link-btn">Back to store</Link></p></div></div>;
  return <AdminShell user={{ name: user.name, phone: user.phone }}>{children}</AdminShell>;
}
