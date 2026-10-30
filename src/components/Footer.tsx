import Link from "next/link";
import { site } from "@/config/site";
import type { NavItem } from "@/lib/nav";
import { whatsappLink } from "@/lib/whatsapp";
import { LogoMark } from "./Logo";
import { Newsletter } from "./Newsletter";

export function Footer({ nav }: { nav: NavItem[] }) {
  const help = whatsappLink(`Halo ${site.brandName}, saya butuh bantuan.`);
  const columns = [
    { title: "Shop", links: nav.map((n) => ({ label: n.label, href: n.href })) },
    {
      title: "Help",
      links: [
        { label: "Chat on WhatsApp", href: help },
        { label: "Track Order & Return", href: help },
        { label: "Shopping Bag", href: "/cart" },
        { label: "Wish List", href: "/wishlist" },
      ],
    },
    {
      title: "About Us",
      links: [
        { label: "Our Brands", href: "/brands" },
        { label: "What's New", href: "/whats-new" },
        { label: "Bestsellers", href: "/bestsellers" },
        { label: "We Made Too Much", href: "/sale" },
      ],
    },
    {
      title: "Follow Us",
      links: Object.entries(site.social).map(([name, href]) => ({
        label: name === "tiktok" ? "TikTok" : name === "youtube" ? "YouTube" : name[0].toUpperCase() + name.slice(1),
        href,
      })),
    },
  ];

  return (
    <footer className="mt-auto bg-page">
      <div className="mx-auto grid max-w-[1920px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[repeat(4,1fr)_1.6fr] lg:px-14">
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:underline">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Newsletter />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 text-[13px] text-muted sm:px-8 lg:px-14">
          <LogoMark className="size-5 text-black" />
          <span>© {site.brandName}. All rights reserved.</span>
          <span>{site.region}</span>
          <a href={`mailto:${site.email}`} className="hover:underline">
            {site.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
