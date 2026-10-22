"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  ["/admin", "Dashboard", "▦"], ["/admin/orders", "Hub Orders", "🛒"], ["/admin/track", "Track Orders", "📍"],
  ["/admin/returns", "Returns", "↩"], ["/admin/cancellations", "Cancellations", "⊘"], ["/admin/issues", "Issues", "❗"],
  ["/admin/products", "Listings", "☰"], ["/admin/categories", "Categories", "🗂"], ["/admin/inventory", "Inventory", "📦"],
  ["/admin/payments", "Payments", "💳"], ["/admin/performance", "Performance", "⚙"], ["/admin/opportunities", "Opportunities", "☆"], ["/admin/reports", "Reports", "📄"],
];

export default function AdminShell({ user, children }) {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const on = (h) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  return (
    <div className="ash">
      <aside className={"ash-side" + (open ? " open" : "")}>
        <div className="ash-brand"><b>🌿 Veda</b><small>Seller panel</small></div>
        <div className="ash-who">{user.name || user.phone}</div>
        <nav>
          {NAV.map(([h, l, ic]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><span aria-hidden>{ic}</span>{l}</Link>)}
          <Link href="/"><span aria-hidden>↗</span>View store</Link>
        </nav>
      </aside>
      {open && <div className="ash-bg" onClick={() => setOpen(false)} />}
      <div className="ash-main">
        <div className="ash-top"><button onClick={() => setOpen(!open)} aria-label="Menu">{open ? "✕" : "☰"}</button><b>{(NAV.find(([h]) => on(h)) || [])[1] || "Admin"}</b></div>
        <div className="adm">{children}</div>
      </div>
    </div>
  );
}
