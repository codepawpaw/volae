import { logPaymentNotification } from "@/lib/db";

// Account linking notification URL: https://volae.id/api/midtrans/account-linking
// Midtrans reports GoPay account linking results here. The shop does not link GoPay accounts
// yet, so notifications are only recorded in payment_notifications.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  try {
    // These carry no signature_key, so they are stored as unverified.
    await logPaymentNotification("account_linking", null, false, body);
  } catch (error) {
    console.error("[midtrans] could not log account linking notification", error);
    return Response.json({ ok: false, error: "temporary failure" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
