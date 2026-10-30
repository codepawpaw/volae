"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

type Slide = { image: string; title: string; ctas: readonly { label: string; href: string }[] };
type Props = { title: string; links: readonly { label: string; href: string }[]; slides: readonly Slide[] };

/** Homepage hero: link list on the left, auto-playing banner with a pause button on the right. */
export function Hero({ title, links, slides }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [playing, slides.length]);

  return (
    <section className="flex flex-col bg-page lg:flex-row">
      <div className="px-5 py-8 sm:px-8 lg:w-[280px] lg:shrink-0 lg:px-14 lg:py-10 xl:w-[332px]">
        <h1 className="text-[34px] font-bold leading-none tracking-[-0.03em] lg:text-[38px]">{title}</h1>
        <ul className="no-scrollbar mt-6 flex gap-6 overflow-x-auto whitespace-nowrap text-[17px] lg:mt-10 lg:block lg:space-y-[18px] lg:whitespace-normal">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative min-h-[520px] flex-1 overflow-hidden bg-tile lg:mr-[60px] lg:min-h-[620px] xl:h-[calc(100vh-200px)] xl:max-h-[860px]">
        {slides.map((slide, i) => (
          <div
            key={slide.image + i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Image src={slide.image} alt="" fill preload={i === 0} sizes="(min-width: 1024px) 75vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute inset-x-5 bottom-24 flex flex-col gap-8 sm:inset-x-8 lg:inset-x-14 lg:bottom-10 lg:flex-row lg:items-end lg:justify-between">
              <p className="whitespace-pre-line text-[56px] font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-[72px] lg:mb-14 lg:text-[88px]">
                {slide.title}
              </p>
              <div className="flex flex-col gap-3">
                {slide.ctas.map((cta) => (
                  <Link
                    key={cta.href}
                    href={cta.href}
                    tabIndex={i === index ? undefined : -1}
                    className="flex h-[54px] min-w-[256px] items-center justify-center border border-black bg-white px-6 text-[14px] font-bold uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white"
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="absolute bottom-6 left-5 flex size-[42px] items-center justify-center rounded-full bg-white sm:left-8 lg:left-14"
          >
            {playing ? <Pause className="size-4 fill-black" /> : <Play className="size-4 fill-black" />}
          </button>
        )}
      </div>
    </section>
  );
}
