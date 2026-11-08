import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Order, PaymentStatus } from "./types";

// Midtrans Snap (redirect mode): the server creates a transaction and sends the buyer to
// Midtrans' hosted payment page, so no client key or snap.js is needed.
// Docs: https://docs.midtrans.com/reference/snap-api

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY is not set.");
  return key;
}

const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === "true";
const snapBase = () => (isProduction() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
const apiBase = () => (isProduction() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`,
  };
  // Send notifications for this transaction here, whatever the dashboard says.
  if (process.env.MIDTRANS_NOTIFICATION_URL) h["X-Override-Notification"] = process.env.MIDTRANS_NOTIFICATION_URL;
  return h;
}

/** Snap payment links stay open this long; unpaid orders then expire. */
export const PAYMENT_WINDOW_HOURS = 24;

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export type SnapTransaction = { token: string; redirectUrl: string; expiresAt: string };

export async function createSnapTransaction(order: Order): Promise<SnapTransaction> {
  const { name, phone, email, address } = order.customer;
  const body = {
    transaction_details: { order_id: order.number, gross_amount: order.total },
    // Midtrans requires the items to add up to gross_amount, so shipping is an item too.
    item_details: [
      ...order.lines.map((l) => ({
        id: clip(l.productId ?? "item", 50),
        name: clip(`${l.name} ${l.color} ${l.size}`.trim(), 50),
        brand: clip(l.brand, 50) || undefined,
        price: l.unitPrice,
        quantity: l.qty,
      })),
      ...(order.shipping.cost > 0
        ? [
            {
              id: "shipping",
              name: clip(`Shipping ${order.shipping.courierName} ${order.shipping.serviceName}`.trim(), 50),
              price: order.shipping.cost,
              quantity: 1,
            },
          ]
        : []),
    ],
    customer_details: {
      first_name: clip(name, 255),
      phone,
      ...(email ? { email } : {}),
      ...(address
        ? {
            shipping_address: {
              first_name: clip(name, 255),
              phone,
              address: clip(address, 200),
              ...(order.shipping.postalCode ? { postal_code: order.shipping.postalCode } : {}),
              country_code: "IDN",
            },
          }
        : {}),
    },
    callbacks: process.env.MIDTRANS_FINISH_URL ? { finish: process.env.MIDTRANS_FINISH_URL } : undefined,
    expiry: { unit: "hour", duration: PAYMENT_WINDOW_HOURS },
  };

  const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!res.ok || !data.token || !data.redirect_url) {
    throw new Error(`Midtrans Snap error ${res.status}: ${(data.error_messages ?? []).join("; ") || "no token"}`);
  }
  return {
    token: data.token,
    redirectUrl: data.redirect_url,
    expiresAt: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600_000).toISOString(),
  };
}

/** The fields we use from Midtrans' transaction status / notification body. */
export type MidtransStatus = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  signature_key?: string;
};

/** Current status straight from Midtrans; null when Midtrans has no such transaction. */
export async function getTransactionStatus(orderNumber: string): Promise<MidtransStatus | null> {
  const res = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderNumber)}/status`, {
    headers: headers(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as MidtransStatus | null;
  if (!data) throw new Error(`Midtrans status error ${res.status}`);
  if (data.status_code === "404") return null;
  if (!data.transaction_status) throw new Error(`Midtrans status error ${data.status_code}`);
  return data;
}

/**
 * Checks signature_key = SHA512(order_id + status_code + gross_amount + server key).
 * MIDTRANS_SIGNATURE_KEY is accepted too, in case notifications are signed with another key.
 */
export function verifySignature(n: Partial<MidtransStatus>): boolean {
  if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) return false;
  const given = Buffer.from(n.signature_key, "utf8");
  const keys = [process.env.MIDTRANS_SERVER_KEY, process.env.MIDTRANS_SIGNATURE_KEY].filter((k): k is string => !!k);
  return keys.some((key) => {
    const expected = Buffer.from(
      createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`).digest("hex"),
      "utf8",
    );
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}

/** Maps a Midtrans transaction to our payment status. */
export function paymentStatusOf(s: Pick<MidtransStatus, "transaction_status" | "fraud_status">): PaymentStatus {
  switch (s.transaction_status) {
    case "capture":
      // Card payments: "challenge" waits for review in the dashboard.
      return s.fraud_status === "accept" || !s.fraud_status ? "paid" : s.fraud_status === "deny" ? "failed" : "pending";
    case "settlement":
      return "paid";
    case "pending":
    case "authorize":
      return "pending";
    case "deny":
    case "failure":
      return "failed";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "refunded";
    default:
      return "pending";
  }
}
