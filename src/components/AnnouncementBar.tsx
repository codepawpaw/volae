"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Announcement = { text: string; href: string };

export function AnnouncementBar({ items }: { items: readonly Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const go = (step: number) => setIndex((i) => (i + step + items.length) % items.length);
  const current = items[index];

  return (
    <div
      className="bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex h-[47px] max-w-[880px] items-center justify-between px-2">
        <button type="button" onClick={() => go(-1)} aria-label="Previous message" className="p-2">
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <Link href={current.href} aria-live="polite" className="min-w-0 truncate px-2 text-[14px] hover:underline lg:text-[15px]">
          {current.text}
        </Link>
        <button type="button" onClick={() => go(1)} aria-label="Next message" className="p-2">
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
