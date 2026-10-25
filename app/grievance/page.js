import { company } from "../../lib/company";
export const metadata = { title: "Grievance / Complaints" };
export const dynamic = "force-dynamic";

export default function Page() {
  const c = company();
  return (
    <div className="container"><div className="page">
      <h1>Grievance redressal</h1>
      <p>If you have a complaint about a product, seller, delivery, refund or your data, please contact our Grievance Officer. We acknowledge complaints within 48 hours and aim to resolve them within 15 days.</p>
      <h2>Grievance Officer</h2>
      <p><b>{c.officer}</b><br />{c.name}<br />{c.address}<br />
        {c.email ? <>Email: <a href={`mailto:${c.email}`}>{c.email}</a><br /></> : null}
        {c.phone ? <>Phone: {c.phone}<br /></> : null}
        {!c.email && !c.phone ? <span className="muted">Contact details will be published here before launch.</span> : null}</p>
      <h2>Please include</h2>
      <ul><li>Your order number and registered mobile number</li><li>What went wrong, with photos if the product is damaged or wrong</li></ul>
      <p>Medicines and health products: if you suspect a product is spurious, expired or caused a reaction, tell us immediately and also stop using it.</p>
    </div></div>
  );
}
