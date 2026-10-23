import { OrdersList } from "../../components/OrdersClient";
export const metadata = { title: "My orders", robots: { index: false } };
export default function Page() { return <OrdersList />; }
