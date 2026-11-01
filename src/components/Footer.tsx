import Link from "next/link";
import { site } from "@/config/site";
import type { NavItem } from "@/lib/nav";
import type { FooterColumn } from "@/lib/types";
import { LogoMark } from "./Logo";
import { Newsletter } from "./Newsletter";

export function Footer({ nav, columns: extra }: { nav: NavItem[]; columns: FooterColumn[] }) {
  const columns = [{ title: "Shop", links: nav.map((n) => ({ label: n.label, href: n.href })) }, ...extra];

  return (
    <footer className="mt-auto bg-page">
      <div
        className="mx-auto grid max-w-[1920px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[repeat(var(--columns),1fr)_1.6fr] lg:px-14"
        style={{ "--columns": columns.length } as React.CSSProperties}
      >
        {columns.map((col, i) => (
          <div key={i}>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              {col.links.map((l, i) => (
                <li key={i}>
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
