import { getOrderByNumber } from "@/lib/db";
import { syncOrderPayment } from "@/lib/payments";
import type { Order } from "@/lib/types";

// Finish redirect URL: https://volae.id/finish-payment
// Midtrans appends ?order_id=…&status_code=…&transaction_status=…, which anyone could edit,
// so the status is looked up with Midtrans before choosing where to send the buyer.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const number = (url.searchParams.get("order_id") ?? "").slice(0, 40);

  let order: Order | null = null;
  try {
    order = await syncOrderPayment(number);
  } catch (error) {
    console.error(`[midtrans] finish: could not sync ${number}`, error);
    order = await getOrderByNumber(number).catch(() => null);
  }

  const ok = order && (order.payment.status === "paid" || order.payment.status === "pending");
  const target = ok
    ? (process.env.MIDTRANS_SUCCESS_URL ?? "/success-payment")
    : (process.env.MIDTRANS_FAILED_URL ?? "/failed-payment");
  const destination = new URL(target, url.origin);
  if (order) destination.searchParams.set("order", order.number);
  return Response.redirect(destination, 303);
}
