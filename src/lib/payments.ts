import "server-only";
import { applyPayment, getOrderByNumber } from "./db";
import { getTransactionStatus, paymentStatusOf } from "./midtrans";
import type { Order } from "./types";

/** Order numbers look like VL261107001; anything else is not ours. */
export const ORDER_NUMBER_PATTERN = /^VL\d{9,12}$/;

/**
 * Asks Midtrans for the order's current status and saves it. The status API is the source of
 * truth, so neither a notification body nor finish-URL query parameters are trusted directly.
 * Returns the updated order, or null if there is no such order.
 */
export async function syncOrderPayment(number: string): Promise<Order | null> {
  if (!ORDER_NUMBER_PATTERN.test(number)) return null;
  const order = await getOrderByNumber(number);
  if (!order) return null;

  const tx = await getTransactionStatus(number);
  if (!tx) return order; // buyer has not picked a payment method yet

  let status = paymentStatusOf(tx);
  if (status === "paid" && Math.round(Number(tx.gross_amount)) !== order.total) {
    console.error(`[midtrans] ${number}: paid ${tx.gross_amount} but order total is ${order.total}; not marking paid`);
    status = "pending";
  }
  await applyPayment(number, { status, type: tx.payment_type ?? null, transactionId: tx.transaction_id ?? null });
  return getOrderByNumber(number);
}
