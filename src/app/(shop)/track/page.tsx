import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getOrderByNumber } from "@/lib/db";
import { shipmentStatusLabel } from "@/lib/couriers";
import { formatPrice } from "@/lib/format";
import { ORDER_NUMBER_PATTERN } from "@/lib/payments";
import { syncShipment } from "@/lib/shipping";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Track Order", robots: { index: false } };

const fieldClass = "h-[48px] w-full border border-line bg-white px-4 text-[15px] outline-none focus:border-black";

/** 0812…, +62812… and 62812… are the same number. */
const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
};

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 40) : "");

export default function TrackPage(props: PageProps<"/track">) {
  return (
    <div className="bg-page px-5 py-12 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-[640px] bg-white px-6 py-12 sm:px-12">
        <h1 className="text-center text-[28px] font-semibold">Track your order</h1>
        <Suspense fallback={<div className="mt-8 h-[220px] animate-pulse bg-page" />}>
          <Tracker {...props} />
        </Suspense>
      </div>
    </div>
  );
}

async function Tracker({ searchParams }: PageProps<"/track">) {
  const params = await searchParams;
  const number = one(params.order).toUpperCase();
  const phone = one(params.phone);

  let order: Order | null = null;
  let history: { status: string; note: string; updatedAt: string }[] = [];
  let notFound = false;
  if (number || phone) {
    const found = ORDER_NUMBER_PATTERN.test(number) ? await getOrderByNumber(number).catch(() => null) : null;
    if (found && phone && normalizePhone(found.customer.phone) === normalizePhone(phone)) {
      order = found;
      try {
        ({ order, history } = await syncShipment(found));
      } catch (error) {
        console.error(`[biteship] track: could not sync ${number}`, error);
      }
    } else {
      notFound = true;
    }
  }

  return (
    <>
      <form method="get" className="mx-auto mt-8 max-w-[420px] space-y-3">
        <input name="order" required defaultValue={number} placeholder="Order number, e.g. VL261108001" aria-label="Order number" className={fieldClass} />
        <input
          name="phone"
          required
          type="tel"
          defaultValue={phone}
          placeholder="WhatsApp number used at checkout"
          aria-label="WhatsApp number"
          className={fieldClass}
        />
        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center bg-black text-[13px] font-bold uppercase tracking-[0.14em] text-white"
        >
          Track
        </button>
        {notFound && (
          <p role="alert" className="text-[14px] text-brand">
            We could not find an order with this number and phone number.
          </p>
        )}
      </form>

      {order && <OrderTracking order={order} history={history} />}
    </>
  );
}

function OrderTracking({ order, history }: { order: Order; history: { status: string; note: string; updatedAt: string }[] }) {
  const { shipping } = order;
  const { shipment } = shipping;
  const paid = order.payment.status === "paid";
  return (
    <div className="mt-10 border-t border-line pt-8 text-[15px]">
      <dl className="space-y-2">
        <Row label="Order" value={order.number} />
        <Row label="Total" value={formatPrice(order.total)} />
        {shipping.courierCode && <Row label="Courier" value={`${shipping.courierName} ${shipping.serviceName}`} />}
        {shipment.waybillId && <Row label="Tracking number" value={shipment.waybillId} mono />}
        <Row
          label="Status"
          value={
            order.status === "cancelled"
              ? "Cancelled"
              : !paid
                ? "Waiting for payment"
                : shipment.id
                  ? shipmentStatusLabel(shipment.status, "en")
                  : "Paid, preparing your order"
          }
        />
      </dl>

      {history.length > 0 && (
        <ol className="mt-8 space-y-4 border-l border-line pl-5">
          {[...history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[25px] top-1.5 size-2.5 rounded-full ${i === 0 ? "bg-black" : "bg-line"}`} />
              <p className="font-semibold">{shipmentStatusLabel(h.status, "en")}</p>
              {h.note && <p className="text-muted">{h.note}</p>}
              {h.updatedAt && (
                <p className="text-[13px] text-subtle">
                  {new Date(h.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {shipment.trackingUrl && (
        <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block underline underline-offset-4">
          Open courier tracking page
        </a>
      )}
      <div className="mt-6">
        <Link href="/" className="underline underline-offset-4">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-semibold ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
