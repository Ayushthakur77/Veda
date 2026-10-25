export const metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <div className="container"><div className="page">
      <h1>Privacy Policy</h1>
      <p className="muted">Draft — to be reviewed by Veda’s legal advisor before launch.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account: mobile number, or name and e-mail from Google sign-in.</li>
        <li>Orders: delivery address, items, payment status. Card/UPI details go directly to Razorpay and are never stored by us.</li>
        <li>Sellers: business, licence, pharmacist, identity and bank details for verification and settlement.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To deliver orders, take payment, prevent fraud, give support and meet legal obligations. The seller and courier receive only what is needed to pack and deliver your order. We do not sell your data.</p>
      <h2>Security and retention</h2>
      <p>Data is stored in a secured database; access is limited to authorised staff. We keep order and invoice records for the period required by law.</p>
      <h2>Your choices</h2>
      <p>You can ask us to correct or delete your data (subject to legal record-keeping) through the <a href="/grievance">Grievance page</a>.</p>
    </div></div>
  );
}
