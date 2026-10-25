export const metadata = { title: "Seller Agreement" };

export default function Page() {
  return (
    <div className="container"><div className="page">
      <h1>Seller Agreement</h1>
      <p className="muted">Draft for review by Veda’s legal advisor. By applying you accept these terms.</p>
      <h2>1. Role of Veda and the seller</h2>
      <p>Veda is an online marketplace that connects customers with independent sellers. The seller is the actual seller of the goods, and issues the tax invoice for every order. Veda collects the customer’s payment and settles the seller’s share, and arranges courier pickup and delivery.</p>
      <h2>2. Licences and eligibility</h2>
      <ul>
        <li>The seller must hold every licence required by law for the goods it sells (for pharmacies: a valid drug licence for the licensed premises and a registered pharmacist in charge), and must keep them valid. Expired or cancelled licences must be reported to Veda immediately; listings are then switched off.</li>
        <li>Goods are supplied only from the licensed premises declared in the application.</li>
        <li>Veda may verify all documents with the issuing authority and may reject, suspend or remove a seller or listing at any time for non-compliance.</li>
      </ul>
      <h2>3. Products</h2>
      <ul>
        <li>Only genuine, unexpired products with correct labels, batch number and expiry may be listed and shipped. Remaining shelf life at dispatch must be at least 30 days (and shown on the batch).</li>
        <li>Prescription-only medicines (Schedule H, H1, X) and narcotic / psychotropic substances cannot be listed on Veda until Veda announces a compliant prescription process.</li>
        <li>No false medical claims. Listing descriptions must match approved labelling.</li>
        <li>MRP printed on the pack must not be exceeded.</li>
      </ul>
      <h2>4. Orders, invoice and delivery</h2>
      <ul>
        <li>The seller packs the exact batch allotted, encloses a valid tax invoice, and marks the order packed on the seller panel promptly.</li>
        <li>For every medicine sale the seller keeps the records required by law (invoice, batch, buyer details) for the period the law requires.</li>
      </ul>
      <h2>5. Prescription checking</h2>
      <p>Where a product legally needs a prescription, the seller’s registered pharmacist must verify the prescription before supply. Until Veda enables prescription orders, such products are not allowed.</p>
      <h2>6. Payments and settlement</h2>
      <p>Veda deducts its commission (as agreed at approval) and settles the balance to the seller’s verified bank account for delivered orders. Refunds to customers for returned, undelivered or cancelled orders are adjusted against the seller’s balance where the cause lies with the seller.</p>
      <h2>7. Returns, refunds and complaints</h2>
      <p>The seller accepts returns for wrong, damaged, expired or defective goods as per Veda’s Refund Policy, and cooperates with complaint investigations within 48 hours.</p>
      <h2>8. Liability</h2>
      <p>The seller is solely responsible for the quality, authenticity, labelling and legal compliance of the goods it supplies, and indemnifies Veda against claims, penalties and losses arising from them. Veda’s liability is limited to the commission it earned on the relevant order, to the extent the law permits.</p>
      <h2>9. Data</h2>
      <p>The seller uses customer information (name, address, phone) only to fulfil the order and the law-required records, and not for marketing.</p>
      <h2>10. Termination</h2>
      <p>Either party may end this agreement with written notice; pending orders and settlements are completed. Veda may suspend immediately for breach. Governing law: India; courts at Delhi.</p>
    </div></div>
  );
}
