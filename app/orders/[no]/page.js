import { OrderDetail } from "../../../components/OrdersClient";
export const metadata = { title: "Order", robots: { index: false } };
export default function Page({ params, searchParams }) { return <OrderDetail no={params.no} fresh={searchParams?.new === "1"} />; }
