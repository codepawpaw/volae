import "server-only";

// Biteship API client. Docs: https://biteship.com/id/docs/intro
// The key decides the mode: biteship_test.* simulates orders, biteship_live.* books real pickups.

const BASE = "https://api.biteship.com";

export class BiteshipError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: number | null,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "BiteshipError";
  }
}

function apiKey(): string {
  const key = process.env.BITESHIP_API_KEY;
  if (!key) throw new Error("BITESHIP_API_KEY is not set.");
  return key;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: apiKey(), Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => null)) as ({ success?: boolean; error?: string; code?: number } & T) | null;
  if (!res.ok || !data || data.success === false) {
    throw new BiteshipError(
      `Biteship ${method} ${path} failed (${res.status}): ${data?.error ?? "no response body"}`,
      res.status,
      typeof data?.code === "number" ? data.code : null,
      data,
    );
  }
  return data;
}

// ---------- Maps ----------

export type Area = { id: string; name: string; postalCode: string };

type RawArea = { id: string; name: string; postal_code?: number | string | null };

/** Indonesian areas (district + postal code) matching the text, e.g. "Pesanggrahan" or "12250". */
export async function searchAreas(input: string): Promise<Area[]> {
  const q = new URLSearchParams({ countries: "ID", input, type: "single" });
  const data = await call<{ areas?: RawArea[] }>("GET", `/v1/maps/areas?${q}`);
  return (data.areas ?? []).map((a) => ({ id: a.id, name: a.name, postalCode: a.postal_code ? String(a.postal_code) : "" }));
}

// ---------- Rates ----------

export type BiteshipItem = {
  name: string;
  description?: string;
  category?: string;
  sku?: string;
  /** Rupiah, per unit. */
  value: number;
  quantity: number;
  /** Grams, per unit. */
  weight: number;
};

export type Rate = {
  courierCode: string;
  serviceCode: string;
  courierName: string;
  serviceName: string;
  description: string;
  duration: string;
  price: number;
};

type RawRate = {
  courier_code: string;
  courier_service_code: string;
  courier_name?: string;
  courier_service_name?: string;
  description?: string;
  duration?: string;
  shipment_duration_range?: string;
  shipment_duration_unit?: string;
  price: number;
};

function durationOf(r: RawRate): string {
  if (r.shipment_duration_range && r.shipment_duration_unit) {
    return `${r.shipment_duration_range} ${r.shipment_duration_unit}`;
  }
  return r.duration ?? "";
}

export async function getRates(input: {
  originAreaId: string;
  destinationAreaId: string;
  couriers: string[];
  items: BiteshipItem[];
}): Promise<Rate[]> {
  const data = await call<{ pricing?: RawRate[] }>("POST", "/v1/rates/couriers", {
    origin_area_id: input.originAreaId,
    destination_area_id: input.destinationAreaId,
    couriers: input.couriers.join(","),
    items: input.items,
  });
  return (data.pricing ?? [])
    .filter((r) => r.courier_code && r.courier_service_code && Number.isFinite(r.price) && r.price >= 0)
    .map((r) => ({
      courierCode: r.courier_code,
      serviceCode: r.courier_service_code,
      courierName: r.courier_name ?? r.courier_code.toUpperCase(),
      serviceName: r.courier_service_name ?? r.courier_service_code,
      description: r.description ?? "",
      duration: durationOf(r),
      price: Math.round(r.price),
    }));
}

// ---------- Orders (shipments) ----------

export type Shipment = {
  id: string;
  status: string | null;
  trackingId: string | null;
  waybillId: string | null;
  trackingUrl: string | null;
  price: number | null;
  history: { status: string; note: string; updatedAt: string }[];
};

type RawOrder = {
  id: string;
  status?: string | null;
  price?: number | null;
  courier?: {
    tracking_id?: string | null;
    waybill_id?: string | null;
    link?: string | null;
    history?: { status?: string; note?: string; updated_at?: string }[] | null;
  } | null;
};

function shipmentOf(o: RawOrder): Shipment {
  return {
    id: o.id,
    status: o.status ?? null,
    trackingId: o.courier?.tracking_id ?? null,
    waybillId: o.courier?.waybill_id ?? null,
    trackingUrl: o.courier?.link ?? null,
    price: typeof o.price === "number" ? Math.round(o.price) : null,
    history: (o.courier?.history ?? []).map((h) => ({
      status: h.status ?? "",
      note: h.note ?? "",
      updatedAt: h.updated_at ?? "",
    })),
  };
}

export type CreateShipmentInput = {
  referenceId: string;
  shipper: { name: string; phone: string; email: string };
  origin: { contactName: string; contactPhone: string; address: string; note: string; areaId: string; postalCode: string };
  destination: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    note: string;
    areaId: string;
    postalCode: string;
  };
  courierCode: string;
  serviceCode: string;
  orderNote: string;
  items: BiteshipItem[];
};

const postal = (code: string) => (/^\d{5}$/.test(code) ? { postal_code: Number(code) } : {});
const withPrefix = (prefix: string, o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [`${prefix}_${k}`, v]));

/** Duplicate reference_id: the shipment already exists (e.g. an earlier request timed out after Biteship saved it). */
const DUPLICATE_REFERENCE = 40002060;

/** Books a pickup with the courier. With a live key this is a real, billed order. */
export async function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  const { origin: o, destination: d } = input;
  try {
    const data = await call<RawOrder>("POST", "/v1/orders", {
      shipper_contact_name: input.shipper.name,
      shipper_contact_phone: input.shipper.phone,
      shipper_contact_email: input.shipper.email || undefined,
      shipper_organization: input.shipper.name,
      origin_contact_name: o.contactName,
      origin_contact_phone: o.contactPhone,
      origin_address: o.address,
      origin_note: o.note || undefined,
      origin_area_id: o.areaId,
      ...withPrefix("origin", postal(o.postalCode)),
      destination_contact_name: d.contactName,
      destination_contact_phone: d.contactPhone,
      destination_contact_email: d.contactEmail || undefined,
      destination_address: d.address,
      destination_note: d.note || undefined,
      destination_area_id: d.areaId,
      ...withPrefix("destination", postal(d.postalCode)),
      courier_company: input.courierCode,
      courier_type: input.serviceCode,
      delivery_type: "now",
      reference_id: input.referenceId,
      order_note: input.orderNote || undefined,
      metadata: { reference_id: input.referenceId },
      items: input.items,
    });
    return shipmentOf(data);
  } catch (error) {
    const existing = (error as BiteshipError).body as { details?: { order_id?: string } } | undefined;
    if (error instanceof BiteshipError && error.code === DUPLICATE_REFERENCE && existing?.details?.order_id) {
      return getShipment(existing.details.order_id);
    }
    throw error;
  }
}

export async function getShipment(id: string): Promise<Shipment> {
  return shipmentOf(await call<RawOrder>("GET", `/v1/orders/${encodeURIComponent(id)}`));
}

export async function cancelShipment(id: string, reason: string): Promise<void> {
  await call("POST", `/v1/orders/${encodeURIComponent(id)}/cancel`, {
    cancellation_reason_code: "others",
    cancellation_reason: reason,
  });
}
