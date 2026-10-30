import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "../../_components/order-status";
import { StatusSelect } from "../../_components/StatusSelect";
import { PageHeader } from "../../_components/ui";

export const metadata: Metadata = { title: "Pesanan" };

/** wa.me needs an international number without "+"; Indonesian numbers often start with 0. */
function customerWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const params = await searchParams;
  const filter = ORDER_STATUSES.find((s) => s === params.status);
  const { orders } = await readDatabase();
  const shown = filter ? orders.filter((o) => o.status === filter) : orders;
  const countBy = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <>
      <PageHeader title="Pesanan" />
      <p className="-mt-4 mb-6 max-w-2xl text-[14px] text-muted">
        Setiap checkout via WhatsApp tersimpan di sini. Ubah status setelah pesanan dikonfirmasi atau
        dibayar di WhatsApp.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-[14px]">
        <Link
          href="/admin/orders"
          className={`rounded-full px-4 py-2 ${!filter ? "bg-ink text-white" : "bg-white hover:outline hover:outline-line"}`}
        >
          Semua ({orders.length})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-4 py-2 ${filter === s ? "bg-ink text-white" : "bg-white hover:outline hover:outline-line"}`}
          >
            {STATUS_LABELS[s]} ({countBy(s)})
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="bg-white px-6 py-10 text-center text-[14px] text-muted">Belum ada pesanan.</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((o) => (
            <li key={o.id} className="bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[17px] font-semibold">{o.number}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {new Date(o.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <StatusSelect id={o.id} status={o.status} />
              </div>

              <div className="mt-5 grid gap-6 text-[14px] lg:grid-cols-[1fr_320px]">
                <table className="w-full text-left">
                  <tbody>
                    {o.lines.map((l, i) => (
                      <tr key={i} className="border-t border-line align-top">
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold">{l.name}</p>
                          <p className="text-muted">
                            {l.brand} · {l.color} · Size {l.size}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                          {l.qty} × {formatPrice(l.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pl-3 text-right">{formatPrice(l.qty * l.unitPrice)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line font-semibold">
                      <td className="py-2.5" colSpan={2}>
                        Total
                      </td>
                      <td className="py-2.5 text-right">{formatPrice(o.total)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="space-y-1.5 rounded-xl bg-page p-4">
                  <p className="font-semibold">{o.customer.name}</p>
                  <a
                    href={customerWhatsapp(o.customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 underline"
                  >
                    <MessageCircle className="size-4" strokeWidth={1.6} />
                    {o.customer.phone}
                  </a>
                  {o.customer.address && <p className="whitespace-pre-line">{o.customer.address}</p>}
                  {o.customer.note && <p className="text-muted">Catatan: {o.customer.note}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
