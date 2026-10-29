import { adminRoute, Invalid, isUuid } from "../../../../../../lib/admin";
import { bookOrder } from "../../../../../../lib/booking";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = adminRoute(async ({ params, body, admin }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  const r = await bookOrder({ orderId: params.id, provider: body.provider === "shadowfax" || !body.provider ? "shadowfax" : "", adminId: admin.id });
  if (!r.allBooked) {
    const errs = r.results.filter((x) => !x.ok).map((x) => x.error).join(" | ");
    throw new Invalid(`Booking not completed: ${errs}`);
  }
  return { ok: true, results: r.results };
}, { write: true });
