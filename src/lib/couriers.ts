// Shared by server code and client forms, so no server-only imports here.

/** Couriers offered at checkout until admin picks others. */
export const DEFAULT_COURIERS = ["jne", "sicepat", "jnt", "anteraja", "pos", "tiki", "ninja", "idexpress"];

/** Couriers admin can choose from (regular parcel services that work with area ids). */
export const COURIER_OPTIONS: { code: string; name: string }[] = [
  { code: "jne", name: "JNE" },
  { code: "sicepat", name: "SiCepat" },
  { code: "jnt", name: "J&T Express" },
  { code: "anteraja", name: "AnterAja" },
  { code: "pos", name: "Pos Indonesia" },
  { code: "tiki", name: "TIKI" },
  { code: "ninja", name: "Ninja Xpress" },
  { code: "idexpress", name: "ID Express" },
  { code: "lion", name: "Lion Parcel" },
  { code: "sap", name: "SAP Express" },
  { code: "wahana", name: "Wahana" },
  { code: "jdl", name: "JDL Express" },
  { code: "rpx", name: "RPX" },
  { code: "paxel", name: "Paxel" },
];

/** Biteship statuses in words, for admin (id) and the storefront (en). */
export const SHIPMENT_STATUS_LABELS: Record<string, { id: string; en: string }> = {
  confirmed: { id: "Menunggu kurir", en: "Waiting for courier" },
  scheduled: { id: "Pickup terjadwal", en: "Pickup scheduled" },
  allocated: { id: "Kurir ditugaskan", en: "Courier assigned" },
  picking_up: { id: "Kurir menuju lokasi", en: "Courier on the way to pick up" },
  picked: { id: "Sudah diambil kurir", en: "Picked up" },
  in_transit: { id: "Dalam perjalanan", en: "In transit" },
  on_hold: { id: "Tertahan", en: "On hold" },
  dropping_off: { id: "Sedang diantar", en: "Out for delivery" },
  delivered: { id: "Terkirim", en: "Delivered" },
  return_in_transit: { id: "Dalam perjalanan retur", en: "Returning to sender" },
  returned: { id: "Diretur", en: "Returned" },
  rejected: { id: "Ditolak", en: "Rejected" },
  disposed: { id: "Dimusnahkan", en: "Disposed" },
  courier_not_found: { id: "Kurir tidak ditemukan", en: "No courier found" },
  cancelled: { id: "Pengiriman dibatalkan", en: "Shipment cancelled" },
};

export function shipmentStatusLabel(status: string | null, lang: "id" | "en"): string {
  if (!status) return lang === "id" ? "Belum dikirim" : "Not shipped yet";
  return SHIPMENT_STATUS_LABELS[status]?.[lang] ?? status.replace(/_/g, " ");
}


/** Statuses in which Biteship still lets the store cancel the pickup. */
export const CANCELLABLE_SHIPMENT_STATUSES = ["confirmed", "scheduled", "allocated", "picking_up"];

/** Statuses after which the store may book a new shipment for the order. */
export const RETRYABLE_SHIPMENT_STATUSES = ["cancelled", "rejected", "courier_not_found", "returned", "disposed"];
