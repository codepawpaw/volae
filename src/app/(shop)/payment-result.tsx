import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getOrderByNumber } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { syncOrderPayment } from "@/lib/payments";
import type { Order } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { ClearCart } from "./ClearCart";

const buttonClass =
  "mx-auto mt-8 flex h-[56px] max-w-[340px] items-center justify-center gap-2 bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark";

/** Reads ?order= (our links) or ?order_id= (Midtrans redirects) and loads the order with a fresh status. */
export async function loadOrder(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<Order | null> {
  const params = await searchParams;
  const raw = params.order ?? params.order_id;
  const number = (typeof raw === "string" ? raw : "").slice(0, 40);
  if (!number) return null;
  try {
    return await syncOrderPayment(number);
  } catch (error) {
    console.error(`[midtrans] could not sync ${number}`, error);
    return getOrderByNumber(number).catch(() => null);
  }
}

/** The Snap page can still be used to pay (or pick another method) until it expires. */
function paymentLink(order: Order): string | null {
  const { status, redirectUrl, expiresAt } = order.payment;
  if (!redirectUrl || !expiresAt || new Date(expiresAt) <= new Date()) return null;
  return status === "pending" || status === "failed" ? redirectUrl : null;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-page px-5 py-12 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-[560px] bg-white px-6 py-14 text-center sm:px-12">
        <h1 className="text-[28px] font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <dl className="mx-auto mt-8 max-w-[340px] space-y-2 border-y border-line py-5 text-left text-[15px]">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Order</dt>
        <dd className="font-semibold">{order.number}</dd>
      </div>
      {order.shipping.courierCode && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Shipping</dt>
          <dd className="text-right">
            {order.shipping.courierName} {order.shipping.serviceName} · {formatPrice(order.shipping.cost)}
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Total</dt>
        <dd className="font-semibold">{formatPrice(order.total)}</dd>
      </div>
    </dl>
  );
}

const help = (order: Order | null) =>
  whatsappLink(order ? `Halo, saya butuh bantuan untuk pembayaran order ${order.number}.` : "Halo, saya butuh bantuan untuk pembayaran.");

function HelpLink({ order }: { order: Order | null }) {
  return (
    <a href={help(order)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-[15px] underline underline-offset-4">
      <MessageCircle className="size-4" strokeWidth={1.6} />
      Need help? Chat with us
    </a>
  );
}

export function SuccessResult({ order }: { order: Order | null }) {
  if (!order) {
    return (
      <Shell title="Thank you!">
        <p className="mt-3 text-[16px] leading-relaxed text-muted">We could not find this order. If you have paid, please contact us.</p>
        <HelpLink order={null} />
      </Shell>
    );
  }
  if (order.payment.status !== "paid" && order.payment.status !== "pending") return <FailedResult order={order} />;

  const paid = order.payment.status === "paid";
  const link = paymentLink(order);
  return (
    <Shell title={paid ? "Payment received" : "Waiting for your payment"}>
      <ClearCart />
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        {paid
          ? `Thank you! Your payment is confirmed. We will pack your order and hand it to ${order.shipping.courierName || "the courier"}; you can follow it on the Track Order page.`
          : "Your order is saved. Please complete the payment with the instructions from Midtrans. After paying, refresh this page to see the confirmation."}
      </p>
      <OrderSummary order={order} />
      {!paid && link && (
        <a href={link} className={buttonClass}>
          View payment instructions
        </a>
      )}
      <div className="flex flex-col items-center">
        {paid && (
          <Link href={`/track?order=${order.number}`} className={buttonClass}>
            Track your order
          </Link>
        )}
        <Link href="/" className="mt-6 inline-block text-[15px] underline underline-offset-4">
          Continue Shopping
        </Link>
        <HelpLink order={order} />
      </div>
    </Shell>
  );
}

export function FailedResult({ order }: { order: Order | null }) {
  if (order && (order.payment.status === "paid" || order.payment.status === "pending")) return <SuccessResult order={order} />;

  const link = order ? paymentLink(order) : null;
  const expired = order?.payment.status === "expired" || order?.payment.status === "cancelled";
  return (
    <Shell title="Payment not completed">
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        {expired
          ? "This payment has expired or was cancelled, so you have not been charged. Your bag is still saved if you want to order again."
          : "Your payment did not go through and you have not been charged. You can try again or choose another payment method."}
      </p>
      {order && <OrderSummary order={order} />}
      {link ? (
        <a href={link} className={buttonClass}>
          Try again
        </a>
      ) : (
        <Link href="/cart" className={buttonClass}>
          Back to your bag
        </Link>
      )}
      <div className="flex flex-col items-center">
        <HelpLink order={order} />
      </div>
    </Shell>
  );
}

export function ResultSkeleton() {
  return (
    <div className="bg-page px-5 py-12 sm:px-8 lg:py-20">
      <div className="mx-auto h-[420px] max-w-[560px] animate-pulse bg-white" />
    </div>
  );
}
