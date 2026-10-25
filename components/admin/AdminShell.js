"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../Icons";
import Brand from "../Brand";

const NAV = [
  ["/admin", "Dashboard", "grid"], ["/admin/orders", "Hub Orders", "cart"], ["/admin/track", "Track Orders", "pin"],
  ["/admin/returns", "Returns", "return"], ["/admin/cancellations", "Cancellations", "ban"], ["/admin/issues", "Issues", "alert"],
  ["/admin/products", "Listings", "list"], ["/admin/categories", "Categories", "folder"], ["/admin/inventory", "Inventory", "box"],
  ["/admin/sellers", "Sellers", "user"], ["/admin/launch", "Launch checklist", "check"], ["/admin/payments", "Payments", "card"], ["/admin/performance", "Performance", "gauge"], ["/admin/opportunities", "Opportunities", "star"], ["/admin/reports", "Reports", "doc"],
];

export default function AdminShell({ user, children, nav = NAV, home = "/admin", label = "Seller panel" }) {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const on = (h) => (h === home ? path === home : path.startsWith(h));
  return (
    <div className="ash">
      <aside className={"ash-side" + (open ? " open" : "")}>
        <div className="ash-brand"><Brand tone="color" height={34} href={home} /><small>{label}</small></div>
        <div className="ash-who">{user.name || user.phone}</div>
        <nav>
          {nav.map(([h, l, ic]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><Icon name={ic} size={20} />{l}</Link>)}
          <Link href="/"><Icon name="external" size={20} />View store</Link>
        </nav>
      </aside>
      {open && <div className="ash-bg" onClick={() => setOpen(false)} />}
      <div className="ash-main">
        <div className="ash-top"><button onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? "close" : "menu"} size={24} /></button><b>{(nav.find(([h]) => on(h)) || [])[1] || "Admin"}</b></div>
        <div className="adm">{children}</div>
      </div>
    </div>
  );
}
