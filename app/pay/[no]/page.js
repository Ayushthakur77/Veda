import PayClient from "../../../components/PayClient";
export const metadata = { title: "Complete payment", robots: { index: false, follow: false } };
export default function Page({ params }) { return <PayClient no={params.no} />; }
