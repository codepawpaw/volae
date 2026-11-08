import "server-only";
import { site } from "@/config/site";
import { applyShipment, getOrderById, prepareShipment } from "./db";
import { createShipment, getRates, getShipment, searchAreas, type Area, type BiteshipItem, type Rate, type Shipment } from "./biteship";
import { getSettings } from "./catalog";
import { DEFAULT_COURIERS } from "./couriers";
import type { Order, ShippingSettings } from "./types";

export const AREA_ID_PATTERN = /^[A-Za-z0-9]{6,80}$/;

export async function getShippingSettings(): Promise<ShippingSettings> {
  return (await getSettings()).shipping;
}

// Area search runs while the buyer types, so keep recent answers for a while.
const areaCache = new Map<string, { at: number; areas: Area[] }>();
const AREA_TTL = 6 * 3600_000;

export async function findAreas(input: string): Promise<Area[]> {
  const key = input.trim().toLowerCase().replace(/\s+/g, " ");
  const hit = areaCache.get(key);
  if (hit && Date.now() - hit.at < AREA_TTL) return hit.areas;
  const areas = (await searchAreas(key)).slice(0, 15);
  if (areaCache.size > 500) areaCache.delete(areaCache.keys().next().value!);
  areaCache.set(key, { at: Date.now(), areas });
  return areas;
}

export type ShippingLine = { name: string; productId: string | null; unitPrice: number; qty: number; weight: number };

const itemsFor = (lines: ShippingLine[]): BiteshipItem[] =>
  lines.map((l) => ({
    name: l.name.slice(0, 100),
    sku: l.productId ?? undefined,
    category: "fashion",
    value: l.unitPrice,
    quantity: l.qty,
    weight: l.weight,
  }));

export type ShippingOption = Rate & { id: string };

export const optionId = (r: Pick<Rate, "courierCode" | "serviceCode">) => `${r.courierCode}:${r.serviceCode}`;

/** Courier options for sending these lines from the store to the area, cheapest first. */
export async function quoteShipping(destinationAreaId: string, lines: ShippingLine[]): Promise<ShippingOption[]> {
  const { origin, couriers } = await getShippingSettings();
  if (!origin) throw new Error("Shipping origin is not set (Admin → Pengiriman).");
  const rates = await getRates({
    originAreaId: origin.areaId,
    destinationAreaId,
    couriers: couriers.length ? couriers : DEFAULT_COURIERS,
    items: itemsFor(lines),
  });
  const seen = new Set<string>();
  return rates
    .map((r) => ({ ...r, id: optionId(r) }))
    .filter((r) => !seen.has(r.id) && seen.add(r.id))
    .sort((a, b) => a.price - b.price);
}

async function save(order: Order, s: Shipment): Promise<Order> {
  await applyShipment(order.id, s);
  return (await getOrderById(order.id)) ?? order;
}

/** Street address plus district, city, province and postal code, for the courier's label. */
const withArea = (address: string, areaName: string) =>
  areaName && !address.includes(areaName) ? `${address}, ${areaName}` : address;

export class ShipmentError extends Error {}

/**
 * Books the courier pickup for a paid order. With a live Biteship key this is a real, billed
 * shipment. The reference id is the order number (VL261108001, then VL261108001-2 after a
 * cancelled shipment), so a retried request returns the existing shipment instead of a second one.
 */
export async function bookShipment(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new ShipmentError("Pesanan tidak ditemukan.");
  if (order.payment.status !== "paid") throw new ShipmentError("Pesanan belum lunas.");
  if (order.status === "cancelled") throw new ShipmentError("Pesanan sudah dibatalkan.");
  const { areaId, courierCode, serviceCode } = order.shipping;
  if (!areaId || !courierCode || !serviceCode) throw new ShipmentError("Pesanan ini tidak punya data kurir (pesanan lama).");
  const { origin } = await getShippingSettings();
  if (!origin) throw new ShipmentError("Alamat pengirim belum diisi di Admin → Pengiriman.");

  const attempt = await prepareShipment(order.id);
  if (attempt === null) throw new ShipmentError("Pesanan ini sudah punya pengiriman aktif.");

  const shipment = await createShipment({
    referenceId: attempt === 0 ? order.number : `${order.number}-${attempt + 1}`,
    shipper: { name: site.brandName, phone: origin.contactPhone, email: site.email },
    origin: { ...origin, address: withArea(origin.address, origin.areaName) },
    destination: {
      contactName: order.customer.name,
      contactPhone: order.customer.phone,
      contactEmail: order.customer.email,
      address: withArea(order.customer.address, order.shipping.areaName),
      note: order.customer.note,
      areaId,
      postalCode: order.shipping.postalCode,
    },
    courierCode,
    serviceCode,
    orderNote: `Order ${order.number}`,
    items: itemsFor(order.lines),
  });
  return save(order, shipment);
}

/** Pulls the shipment's current state from Biteship. Returns the order with its tracking history. */
export async function syncShipment(order: Order): Promise<{ order: Order; history: Shipment["history"] }> {
  if (!order.shipping.shipment.id) return { order, history: [] };
  const shipment = await getShipment(order.shipping.shipment.id);
  return { order: await save(order, shipment), history: shipment.history };
}
