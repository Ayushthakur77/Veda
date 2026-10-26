import Link from "next/link";
import { redirect } from "next/navigation";
import { loadInvoices } from "../../../lib/invoice";
import PrintBtn from "../../../components/PrintBtn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tax invoice", robots: { index: false, follow: false } };

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Page({ params, searchParams }) {
  const r = await loadInvoices(params.no, searchParams?.s || null);
  if (r.error === "login") redirect(`/login?next=/invoice/${params.no}`);
  if (r.error) return <div className="container"><div className="page"><h1>Invoice</h1><p>{r.error === "unpaid" ? "Invoice is available after payment is completed." : "Invoice not found."}</p><Link href="/orders" className="link-btn">My orders</Link></div></div>;
  const { order, invoices, company } = r;
  return (
    <div className="container inv-wrap">
      <div className="inv-bar no-print"><Link href={`/orders/${order.no}`} className="link-btn">← Order</Link><PrintBtn /></div>
      {invoices.length > 1 && !searchParams?.s && <div className="box no-print"><b>This order has invoices from {invoices.length} sellers.</b> All are shown below; each seller issues its own tax invoice.</div>}
      {invoices.map((v) => (
        <section className="inv" key={v.key}>
          <header className="inv-h">
            <div><h1>TAX INVOICE</h1><small>{v.intra ? "Intra-state supply (CGST + SGST)" : "Inter-state supply (IGST)"}</small></div>
            <table className="inv-meta"><tbody>
              <tr><td>Invoice no.</td><td><b>{v.no}</b></td></tr>
              <tr><td>Invoice date</td><td>{dt(v.date)}</td></tr>
              <tr><td>Order ID</td><td>{order.no}</td></tr>
              <tr><td>Order date</td><td>{dt(order.date)}</td></tr>
            </tbody></table>
          </header>
          <div className="inv-parties">
            <div><h3>Sold by (seller of record)</h3><b>{v.seller.name}</b><br />{v.seller.address}<br />
              {v.seller.gstin ? <>GSTIN: {v.seller.gstin}<br /></> : null}
              {v.seller.licence ? <>Drug licence no.: {v.seller.licence}<br /></> : null}
              {v.seller.pharmacist ? <>Authorised pharmacist: {v.seller.pharmacist}{v.seller.pharmacistReg ? ` (Reg. no. ${v.seller.pharmacistReg})` : ""}</> : null}
              {!v.seller.gstin && !v.seller.licence ? <span className="muted">Registration details as per seller records</span> : null}
            </div>
            <div><h3>Billed / shipped to</h3><b>{order.buyer.name}</b><br />{order.buyer.address}<br />{order.buyer.phone ? <>Phone: {order.buyer.phone}<br /></> : null}
              Prescribing doctor: <span className="muted">Not applicable — non-prescription products only</span></div>
          </div>
          <div className="inv-scroll"><table className="inv-t">
            <thead><tr><th>#</th><th>Product</th><th>HSN</th><th>Batch</th><th>Expiry</th><th className="r">Qty</th><th className="r">MRP</th><th className="r">Rate</th><th className="r">Taxable</th><th className="r">GST %</th>{v.intra ? <><th className="r">CGST</th><th className="r">SGST</th></> : <th className="r">IGST</th>}<th className="r">Amount</th></tr></thead>
            <tbody>{v.lines.map((l, n) => (
              <tr key={n}><td>{n + 1}</td><td>{l.name}</td><td>{l.hsn || "—"}</td><td>{l.batch || "—"}</td><td>{l.expiry || "—"}</td><td className="r">{l.qty}</td><td className="r">{inr(l.mrp)}</td><td className="r">{inr(l.rate)}</td><td className="r">{inr(l.taxable)}</td><td className="r">{l.gst}%</td>
                {v.intra ? <><td className="r">{inr(l.cgst)}</td><td className="r">{inr(l.sgst)}</td></> : <td className="r">{inr(l.igst)}</td>}<td className="r">{inr(l.gross)}</td></tr>))}</tbody>
          </table></div>
          <div className="inv-sum">
            <table><tbody>
              <tr><td>MRP total</td><td className="r">{inr(v.totals.mrpTotal)}</td></tr>
              <tr><td>Discount on MRP</td><td className="r">− {inr(v.totals.discount)}</td></tr>
              {v.coupon > 0 && <tr><td>Coupon savings</td><td className="r">− {inr(v.coupon)}</td></tr>}
              <tr><td>Taxable value</td><td className="r">{inr(v.totals.taxable)}</td></tr>
              {v.intra ? <><tr><td>CGST</td><td className="r">{inr(v.totals.cgst)}</td></tr><tr><td>SGST</td><td className="r">{inr(v.totals.sgst)}</td></tr></> : <tr><td>IGST</td><td className="r">{inr(v.totals.igst)}</td></tr>}
              <tr><td>Delivery &amp; handling</td><td className="r">{v.delivery > 0 ? inr(v.delivery) : "Free / billed separately"}</td></tr>
              <tr className="tot"><td>Total invoice amount</td><td className="r">{inr(v.totals.total)}</td></tr>
            </tbody></table>
            <p><b>Amount in words:</b> {v.words}</p>
            {v.deliveryNote && <p className="muted">{v.deliveryNote}</p>}
          </div>
          <div className="inv-pay"><b>Payment:</b> {order.pay ? `${(order.pay.method || "Online").toUpperCase()} · Paid${order.pay.ref ? ` · Txn ref ${order.pay.ref}` : ""}` : "Paid online"}</div>
          <footer className="inv-f">
            <p>Prices include GST. MRP is the maximum retail price printed on the pack. Goods once sold are returnable only as per the Refund &amp; Return Policy.</p>
            <p>Declaration: the products are for personal / self use as per label directions. {company.name} operates as a technology platform connecting customers with the seller named above; the seller is the seller of record and responsible for the goods and this invoice. For complaints visit /grievance.</p>
            <p className="r">Authorised signatory — {v.seller.name}<br /><small>This is a computer-generated invoice.</small></p>
          </footer>
        </section>
      ))}
    </div>
  );
}
