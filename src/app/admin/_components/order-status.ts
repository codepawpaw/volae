import type { OrderStatus } from "@/lib/types";

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
