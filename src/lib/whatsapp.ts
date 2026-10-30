import { site } from "@/config/site";
import { formatPrice } from "./format";
import type { Order } from "./types";

export function whatsappLink(text: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function orderMessage(order: Order): string {
  const body = order.lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.brand} - ${l.name}\n` +
        `   Colour: ${l.color} | Size: ${l.size} | Qty: ${l.qty}\n` +
        `   ${formatPrice(l.unitPrice)} x ${l.qty} = ${formatPrice(l.unitPrice * l.qty)}`,
    )
    .join("\n\n");
  const { name, phone, address, note } = order.customer;
  const customer = [
    `Nama: ${name}`,
    `No. HP: ${phone}`,
    ...(address ? [`Alamat: ${address}`] : []),
    ...(note ? [`Catatan: ${note}`] : []),
  ].join("\n");
  return (
    `Halo ${site.brandName}, saya ingin memesan (Order ${order.number}):\n\n${body}\n\n` +
    `Total: ${formatPrice(order.total)}\n\n${customer}\n\n` +
    `Mohon info ketersediaan dan cara pembayarannya. Terima kasih!`
  );
}
