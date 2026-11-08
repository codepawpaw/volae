"use client";

import { useActionState } from "react";
import { CANCELLABLE_SHIPMENT_STATUSES, RETRYABLE_SHIPMENT_STATUSES, shipmentStatusLabel } from "@/lib/couriers";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cancelShipmentAction, createShipmentAction, refreshShipmentAction } from "../actions";

const smallButton =
  "inline-flex h-[34px] items-center justify-center rounded-full border border-line bg-white px-4 text-[13px] hover:border-ink disabled:opacity-50";
const smallPrimary =
  "inline-flex h-[34px] items-center justify-center rounded-full bg-ink px-4 text-[13px] text-white hover:bg-black disabled:opacity-50";

export function ShipmentPanel({ order }: { order: Order }) {
  const [created, create, creating] = useActionState(createShipmentAction, null);
  const [refreshed, refresh, refreshing] = useActionState(refreshShipmentAction, null);
  const [cancelled, cancel, cancelling] = useActionState(cancelShipmentAction, null);
  const { shipping } = order;
  const { shipment } = shipping;

  if (!shipping.courierCode) {
    return <p className="text-muted">Pesanan lama tanpa data kurir (gratis ongkir).</p>;
  }

  const canCreate =
    order.payment.status === "paid" &&
    order.status !== "cancelled" &&
    (!shipment.id || RETRYABLE_SHIPMENT_STATUSES.includes(shipment.status ?? ""));
  const canCancel = !!shipment.id && CANCELLABLE_SHIPMENT_STATUSES.includes(shipment.status ?? "");
  const busy = creating || refreshing || cancelling;
  const message = [created, refreshed, cancelled].find(Boolean);

  return (
    <div className="space-y-1.5">
      <p className="font-semibold">
        {shipping.courierName} {shipping.serviceName} · {formatPrice(shipping.cost)}
      </p>
      <p className="text-muted">
        {(shipping.weight / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg
        {shipping.duration && ` · estimasi ${shipping.duration}`}
      </p>
      {shipping.areaName && <p className="text-muted">{shipping.areaName}</p>}

      <div className="pt-2">
        <p>
          Status: <span className="font-semibold">{shipmentStatusLabel(shipment.status, "id")}</span>
        </p>
        {shipment.waybillId && (
          <p>
            Resi: <span className="font-mono">{shipment.waybillId}</span>
          </p>
        )}
        {shipment.price !== null && shipment.price !== shipping.cost && (
          <p className="text-[#8a5a00]">Tagihan Biteship: {formatPrice(shipment.price)}</p>
        )}
        {shipment.trackingUrl && (
          <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Lacak di Biteship
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {canCreate && (
          <form
            action={create}
            onSubmit={(e) => {
              if (!confirm(`Pesan pickup ${shipping.courierName} ${shipping.serviceName} untuk ${order.number}?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <button type="submit" disabled={busy} className={smallPrimary}>
              {creating ? "Memesan kurir…" : shipment.id ? "Buat pengiriman ulang" : "Buat pengiriman"}
            </button>
          </form>
        )}
        {shipment.id && (
          <form action={refresh}>
            <input type="hidden" name="id" value={order.id} />
            <button type="submit" disabled={busy} className={smallButton}>
              {refreshing ? "Memperbarui…" : "Perbarui status"}
            </button>
          </form>
        )}
        {canCancel && (
          <form
            action={cancel}
            onSubmit={(e) => {
              const reason = prompt("Alasan membatalkan pengiriman?", "Dibatalkan oleh toko");
              if (reason === null) e.preventDefault();
              else (e.currentTarget.elements.namedItem("reason") as HTMLInputElement).value = reason;
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="reason" />
            <button type="submit" disabled={busy} className={smallButton}>
              {cancelling ? "Membatalkan…" : "Batalkan pengiriman"}
            </button>
          </form>
        )}
      </div>
      {!canCreate && !shipment.id && order.payment.status !== "paid" && (
        <p className="text-[13px] text-muted">Pengiriman bisa dibuat setelah pesanan lunas.</p>
      )}
      {message && (
        <p role="status" className={`text-[13px] ${message.ok ? "text-success" : "text-red-700"}`}>
          {message.message}
        </p>
      )}
    </div>
  );
}
