import OrdersAdmin from "../../../components/admin/OrdersAdmin";
export const metadata = { title: "Cancellations" };
export default function Page() { return <OrdersAdmin mode="cancelled" />; }
