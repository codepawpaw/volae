import "server-only";
import { logPaymentNotification } from "@/lib/db";
import { verifySignature, type MidtransStatus } from "@/lib/midtrans";
import { ORDER_NUMBER_PATTERN, syncOrderPayment } from "@/lib/payments";

/**
 * Midtrans HTTP notification for a transaction. Midtrans retries anything that is not 2xx,
 * so only temporary failures (database or Midtrans API down) return 5xx.
 */
export async function handleTransactionNotification(request: Request, kind: "payment" | "recurring"): Promise<Response> {
  let body: Partial<MidtransStatus>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const verified = verifySignature(body);
  const orderNumber = typeof body.order_id === "string" ? body.order_id.slice(0, 100) : null;
  try {
    await logPaymentNotification(kind, orderNumber, verified, body);
  } catch (error) {
    console.error("[midtrans] could not log notification", error);
  }

  if (!verified) {
    console.warn(`[midtrans] ${kind} notification with invalid signature for ${orderNumber}`);
    return Response.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }
  // Dashboard test notifications and transactions from other systems: acknowledge and ignore.
  if (!orderNumber || !ORDER_NUMBER_PATTERN.test(orderNumber)) return Response.json({ ok: true, ignored: true });

  try {
    const order = await syncOrderPayment(orderNumber);
    return Response.json({ ok: true, ignored: !order, payment: order?.payment.status });
  } catch (error) {
    console.error(`[midtrans] could not sync ${orderNumber}`, error);
    return Response.json({ ok: false, error: "temporary failure" }, { status: 500 });
  }
}
