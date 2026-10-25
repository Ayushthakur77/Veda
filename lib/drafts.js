export const DRAFTS = {
  dcd_email: {
    title: "Email to Delhi Drugs Control Department",
    to: "Drugs Control Department, Govt. of NCT of Delhi (use the official e-mail / grievance address on the department website)",
    subject: "Request for written clarification – online health marketplace (Veda), Delhi NCR",
    body: `To,
The Drugs Controller, Drugs Control Department, Government of NCT of Delhi

Subject: Request for written clarification on licensing requirements for an online health marketplace

Respected Sir/Madam,

We are building "Veda" (https://veda-rose-six.vercel.app), an online marketplace for Ayurvedic, Homeopathic and healthcare products for customers in Delhi NCR. We do not hold any drug licence ourselves and do not stock medicines. Sellers on the platform are independent, licensed retailers / pharmacies who hold their own licences, supply from their own licensed premises, and issue their own tax invoice for every order.

Business model in brief:
1. Sellers are onboarded only after we verify their drug licence (where applicable), licensed premises, registered pharmacist and legal identity.
2. The customer pays on our platform (Razorpay). We settle the seller's share after delivery, deducting our commission.
3. Orders are packed and invoiced by the seller; we only arrange courier pickup and delivery.
4. Prescription-only medicines (Schedule H, H1, X) are NOT listed today. Any future sale of prescription medicines would happen only through a licensed pharmacy after a registered pharmacist verifies a valid prescription.

We request your written clarification on:
a) Whether this marketplace model needs any licence or registration from your department, and under which rules.
b) Conditions for licensed pharmacies to sell through such a platform, and any records we must maintain.
c) Whether our platform may collect payment and settle to the licensed seller.
d) Any restrictions on the categories of products (Ayurvedic / Homeopathic / OTC / devices) listed.

Contact: <your name>, <phone>, <email>
Registered address: <address>

Thanking you,
<Name>
Veda`,
  },
  gateway_approval: {
    title: "Email to payment gateway (Razorpay) for approval",
    to: "Razorpay Support / your account manager (also raise it from Dashboard › Help)",
    subject: "Business category confirmation & marketplace settlement for Veda (health products marketplace)",
    body: `Hello Razorpay team,

Our account: <merchant ID / registered email>. Website: https://veda-rose-six.vercel.app

We operate "Veda", a marketplace for Ayurvedic, Homeopathic and healthcare products in Delhi NCR. Licensed retailers / pharmacies sell on the platform; each seller holds their own licences and issues their own invoice. We currently do NOT list prescription-only medicines.

Please confirm:
1. That our business category and website content are acceptable for live payments.
2. Whether marketplace settlement to sellers (Razorpay Route / linked accounts) is available on our account, and the documents you need from us and from each seller (KYC, drug licence where applicable, GSTIN/PAN, bank proof).
3. Any additional compliance you require before we start selling licensed pharmacy products.

Our policies are published at /terms, /privacy, /return-policy, /grievance and /seller-agreement.

Regards,
<Name>, Veda`,
  },
};
