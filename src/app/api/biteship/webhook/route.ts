import { getOrderByShipmentId, logShippingNotification } from "@/lib/db";
import { syncShipment } from "@/lib/shipping";

// Webhook URL (Biteship dashboard → Integrasi → Webhook): https://volae.id/api/biteship/webhook
// Events: order.status, order.price, order.waybill_id.
//
// The body only tells us which shipment changed. Its state is then read back from the Biteship
// API, so a forged request can at most trigger a refresh. Biteship checks the URL with a
// request that may have an empty body when the webhook is added, so that gets a 200 too.

type WebhookBody = { event?: unknown; order_id?: unknown };

export async function POST(request: Request) {
  const raw = await request.text();
  let body: WebhookBody = {};
  try {
    body = raw ? (JSON.parse(raw) as WebhookBody) : {};
  } catch {
    return Response.json({ ok: true, ignored: "invalid json" });
  }

  const event = typeof body.event === "string" ? body.event.slice(0, 60) : null;
  const shipmentId = typeof body.order_id === "string" ? body.order_id.slice(0, 100) : null;
  try {
    await logShippingNotification(event, shipmentId, body);
  } catch (error) {
    console.error("[biteship] could not log webhook", error);
  }
  if (!shipmentId) return Response.json({ ok: true, ignored: true });

  try {
    const order = await getOrderByShipmentId(shipmentId);
    // A shipment from another system, or one replaced after a cancellation.
    if (!order) return Response.json({ ok: true, ignored: true });
    const { order: updated } = await syncShipment(order);
    return Response.json({ ok: true, status: updated.shipping.shipment.status });
  } catch (error) {
    console.error(`[biteship] could not sync shipment ${shipmentId}`, error);
    // 5xx so Biteship retries later.
    return Response.json({ ok: false, error: "temporary failure" }, { status: 500 });
  }
}

/** Some dashboards check the URL with a GET first. */
export function GET() {
  return Response.json({ ok: true });
}
