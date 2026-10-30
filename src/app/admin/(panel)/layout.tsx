import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FolderTree, House, LayoutDashboard, LogOut, ReceiptText, Shirt, Tag } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { site } from "@/config/site";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s | Admin ${site.brandName}` },
  robots: { index: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pesanan", icon: ReceiptText },
  { href: "/admin/products", label: "Produk", icon: Shirt },
  { href: "/admin/brands", label: "Brand", icon: Tag },
  { href: "/admin/categories", label: "Kategori", icon: FolderTree },
  { href: "/admin/home", label: "Beranda", icon: House },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-page lg:flex-row">
      <aside className="flex shrink-0 flex-col bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[240px] lg:border-r lg:border-line">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:py-7">
          <Link href="/admin" className="flex items-center gap-1.5 text-[24px] font-bold tracking-[-0.03em] text-black">
            <LogoMark />
            {site.brandName}
          </Link>
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted lg:mt-1">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-y border-line px-3 py-2 lg:flex-1 lg:flex-col lg:border-0 lg:py-0">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-[15px] hover:bg-page"
            >
              <Icon className="size-[18px]" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-[15px] hover:bg-page"
          >
            <ExternalLink className="size-[18px]" strokeWidth={1.5} />
            Lihat toko
          </Link>
          <form action={logout} className="lg:mt-auto lg:pb-6">
            <button
              type="submit"
              className="flex w-full shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-[15px] hover:bg-page"
            >
              <LogOut className="size-[18px]" strokeWidth={1.5} />
              Keluar
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
