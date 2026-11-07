import type { OrderStatus, PaymentStatus } from "@/lib/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Baru",
  confirmed: "Dikonfirmasi",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-[#fdecee] text-brand",
  confirmed: "bg-[#eef2fb] text-[#2b4a8a]",
  paid: "bg-[#e7efec] text-success",
  shipped: "bg-[#eef2fb] text-[#2b4a8a]",
  completed: "bg-page text-muted",
  cancelled: "bg-page text-muted line-through",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Belum bayar",
  pending: "Menunggu pembayaran",
  paid: "Lunas",
  failed: "Pembayaran gagal",
  expired: "Kedaluwarsa",
  cancelled: "Pembayaran dibatalkan",
  refunded: "Refund",
};

export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-page text-muted",
  pending: "bg-[#fdf4e3] text-[#8a5a00]",
  paid: "bg-[#e7efec] text-success",
  failed: "bg-[#fdecee] text-brand",
  expired: "bg-page text-muted",
  cancelled: "bg-page text-muted",
  refunded: "bg-[#eef2fb] text-[#2b4a8a]",
};

/** Midtrans payment_type in words. */
export function paymentTypeLabel(type: string | null): string | null {
  if (!type) return null;
  const known: Record<string, string> = {
    bank_transfer: "Transfer bank (VA)",
    echannel: "Mandiri Bill",
    permata: "Permata VA",
    credit_card: "Kartu kredit/debit",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    qris: "QRIS",
    cstore: "Indomaret/Alfamart",
    akulaku: "Akulaku",
    kredivo: "Kredivo",
  };
  return known[type] ?? type;
}
