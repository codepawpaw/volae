import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { STATUS_COLORS, STATUS_LABELS } from "../_components/order-status";
import { PageHeader, primaryButton, secondaryButton } from "../_components/ui";

export default async function DashboardPage() {
  await requireAdmin();
  const db = await readDatabase();
  const stats = [
    { label: "Pesanan baru", value: db.orders.filter((o) => o.status === "new").length, href: "/admin/orders?status=new" },
    { label: "Produk aktif", value: db.products.filter((p) => p.isActive).length, href: "/admin/products" },
    { label: "Brand", value: db.brands.length, href: "/admin/brands" },
    { label: "Pelanggan newsletter", value: db.subscribers.length },
  ];
  const recentOrders = db.orders.slice(0, 5);
  const subscribers = [...db.subscribers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/brands/new" className={secondaryButton}>
              Tambah brand
            </Link>
            <Link href="/admin/products/new" className={primaryButton}>
              Tambah produk
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-[13px] text-muted">{s.label}</p>
              <p className="mt-2 text-[32px] font-semibold">{s.value}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="bg-white p-6 hover:outline hover:outline-line">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="bg-white p-6">
              {body}
            </div>
          );
        })}
      </div>

      <section className="mt-10 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Pesanan terbaru</h2>
          <Link href="/admin/orders" className="text-[14px] underline">
            Lihat semua
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted">Belum ada pesanan.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-[14px]">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-semibold">{o.number}</span>
                <span className="min-w-0 flex-1 truncate">{o.customer.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                <span className="w-[120px] text-right">{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 bg-white p-6">
        <h2 className="text-lg font-semibold">Pelanggan newsletter terbaru</h2>
        {subscribers.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted">Belum ada yang mendaftar.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-[14px]">
            {subscribers.map((s) => (
              <li key={s.email} className="flex justify-between gap-4 py-2.5">
                <span className="truncate">{s.email}</span>
                <span className="shrink-0 text-muted">
                  {new Date(s.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
