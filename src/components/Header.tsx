"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, Search, User, X } from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Logo } from "./Logo";
import { useStore } from "./StoreProvider";

export function ArrowRight({ className = "" }: { className?: string }) {
  // lululemon's dashed red arrow.
  return (
    <svg viewBox="0 0 22 12" aria-hidden className={`h-3 w-[22px] text-brand ${className}`}>
      <path d="M0 6h3M5 6h3M10 6h11M15.5 1 21 6l-5.5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function BagIcon({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <svg viewBox="0 0 24 28" aria-hidden className="h-[30px] w-[26px]">
        <path d="M8 8V6a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2.8" y="8" width="18.4" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="absolute inset-x-0 bottom-[5px] text-center text-[11px] font-medium leading-none text-brand">
        {count}
      </span>
    </span>
  );
}

export function Header({ nav }: { nav: NavItem[] }) {
  const { count, wishlist } = useStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close every overlay once a link inside the header is followed.
  const closeOnLinkClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) {
      setOpenMenu(null);
      setMobileOpen(false);
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, searchOpen]);

  const show = (label: string) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  const active = nav.find((n) => n.label === openMenu && n.columns.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-white" onClickCapture={closeOnLinkClick}>
      <div className="relative mx-auto flex h-[60px] max-w-[1920px] items-center px-3 sm:px-5 lg:h-[76px] lg:px-14">
        <button type="button" className="p-2 lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
          <Menu className="size-6" strokeWidth={1.5} />
        </button>

        <Logo className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0" />

        <nav className="ml-[56px] hidden h-full lg:block" aria-label="Main">
          <ul className="flex h-full items-center gap-[44px]">
            {nav.map((item) => (
              <li
                key={item.label}
                className="flex h-full items-center"
                onMouseEnter={() => show(item.label)}
                onMouseLeave={hide}
              >
                <Link
                  href={item.href}
                  aria-expanded={item.columns.length > 0 ? openMenu === item.label : undefined}
                  onFocus={() => show(item.label)}
                  className="relative py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-black"
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-[3px] bg-brand transition-opacity ${
                      openMenu === item.label ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:gap-[34px]">
          <Form action="/search" className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2" strokeWidth={1.5} />
            <input
              name="q"
              type="search"
              placeholder="Search gear, activity"
              aria-label="Search"
              className="h-[48px] w-[240px] rounded-[2px] border border-black pl-11 pr-4 text-[16px] outline-none 2xl:w-[330px]"
            />
          </Form>
          <button type="button" className="p-2 xl:hidden" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="size-6" strokeWidth={1.5} />
          </button>
          <Link href="/admin" className="hidden items-center gap-2.5 text-[16px] lg:flex">
            <User className="size-[26px]" strokeWidth={1.25} />
            Sign In
          </Link>
          <Link href="/wishlist" aria-label={`Wish list, ${wishlist.length} items`} className="relative hidden p-1 sm:block">
            <Heart className="size-[26px]" strokeWidth={1.4} />
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-0.5 flex size-[17px] items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link href="/cart" aria-label={`Shopping bag, ${count} items`} className="p-1">
            <BagIcon count={count} />
          </Link>
        </div>
      </div>

      {/* Desktop mega menu */}
      {active && (
        <>
          <div
            className="absolute inset-x-0 top-full z-10 hidden border-t border-hairline bg-white lg:block"
            onMouseEnter={() => show(active.label)}
            onMouseLeave={hide}
          >
            <div className="mx-auto flex max-w-[1920px] gap-12 px-[60px] pb-8 pt-8">
              {active.featured.length > 0 && (
                <ul className="w-[220px] shrink-0 space-y-[22px] border-r border-line pr-6 text-[16px]">
                  {active.featured.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-1 gap-14 pl-2">
                {active.columns.map((col) => (
                  <div key={col.title}>
                    <Link
                      href={col.href}
                      className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] hover:underline"
                    >
                      {col.title}
                      <ArrowRight />
                    </Link>
                    <ul
                      className={`mt-6 grid gap-y-[22px] text-[16px] ${
                        col.split ? "grid-flow-col grid-rows-[repeat(9,auto)] gap-x-16" : ""
                      }`}
                    >
                      {col.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="whitespace-nowrap hover:underline">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {active.promo && (
                <Link href={active.promo.cta.href} className="group hidden w-[370px] shrink-0 xl:block">
                  <span className="relative block h-[168px] overflow-hidden rounded-[3px] bg-tile">
                    <Image src={active.promo.image} alt="" fill sizes="370px" className="object-cover" />
                  </span>
                  <span className="mt-3 block text-[20px] font-bold leading-tight">{active.promo.title}</span>
                  <span className="mt-1 line-clamp-2 block text-[15px] text-ink">{active.promo.text}</span>
                  <span className="mt-2 flex items-center gap-3 text-[16px] font-bold group-hover:underline">
                    {active.promo.cta.label}
                    <ArrowRight />
                  </span>
                </Link>
              )}
            </div>
            {(active.activities.length > 0 || active.shopAll) && (
              <div className="mx-auto mb-8 flex max-w-[1800px] items-center bg-page px-[42px] py-5 lg:mx-[46px] 2xl:mx-auto">
                {active.activities.length > 0 && (
                  <>
                    <span className="w-[180px] shrink-0 border-r border-line text-[13px] font-bold uppercase tracking-[0.14em]">
                      Activity
                    </span>
                    <ul className="flex flex-wrap gap-x-8 gap-y-2 pl-8 text-[16px]">
                      {active.activities.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="hover:underline">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {active.shopAll && (
                  <Link
                    href={active.shopAll.href}
                    className="ml-auto flex shrink-0 items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] hover:underline"
                  >
                    {active.shopAll.label}
                    <ArrowRight />
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 top-full hidden h-screen bg-black/40 lg:block" aria-hidden onMouseEnter={hide} />
        </>
      )}

      {/* Search overlay (small screens) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Form action="/search" className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2" strokeWidth={1.5} />
              <input
                name="q"
                type="search"
                autoFocus
                placeholder="Search gear, activity"
                aria-label="Search"
                className="h-[48px] w-full rounded-[2px] border border-black pl-11 pr-4 outline-none"
              />
            </Form>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="p-2">
              <X className="size-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-[420px] flex-col overflow-y-auto bg-white">
            <div className="flex h-[60px] items-center justify-between border-b border-hairline px-5">
              <Logo />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2">
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>
            <ul>
              {nav.map((item) => {
                const expandable = item.columns.length > 0;
                const open = mobileSection === item.label;
                return (
                  <li key={item.label} className="border-b border-hairline">
                    {expandable ? (
                      <button
                        type="button"
                        onClick={() => setMobileSection(open ? null : item.label)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between px-5 py-4 text-[14px] font-bold uppercase tracking-[0.14em]"
                      >
                        {item.label}
                        <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
                      </button>
                    ) : (
                      <Link href={item.href} className="block px-5 py-4 text-[14px] font-bold uppercase tracking-[0.14em]">
                        {item.label}
                      </Link>
                    )}
                    {expandable && open && (
                      <div className="space-y-6 bg-page px-5 py-5">
                        <ul className="space-y-3 text-[16px]">
                          {item.featured.map((l) => (
                            <li key={l.href + l.label}>
                              <Link href={l.href}>{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                        {item.columns.map((col) => (
                          <div key={col.title}>
                            <Link href={col.href} className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.14em]">
                              {col.title}
                              <ArrowRight />
                            </Link>
                            <ul className="mt-3 space-y-3 text-[16px]">
                              {col.links.map((l) => (
                                <li key={l.href}>
                                  <Link href={l.href}>{l.label}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <ul className="space-y-4 px-5 py-6 text-[16px]">
              <li>
                <Link href="/wishlist" className="flex items-center gap-3">
                  <Heart className="size-5" strokeWidth={1.4} /> Wish List ({wishlist.length})
                </Link>
              </li>
              <li>
                <Link href="/admin" className="flex items-center gap-3">
                  <User className="size-5" strokeWidth={1.4} /> Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
