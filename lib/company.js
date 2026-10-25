// Set these in Vercel env so the legal / grievance pages show your real details.
export const company = () => ({
  name: process.env.COMPANY_NAME || "Veda",
  officer: process.env.GRIEVANCE_OFFICER || "Grievance Officer, Veda",
  email: process.env.SUPPORT_EMAIL || "",
  phone: process.env.SUPPORT_PHONE || "",
  address: process.env.COMPANY_ADDRESS || "Delhi NCR, India",
});
