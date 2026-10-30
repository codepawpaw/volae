import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/Header";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const { brands, products } = await getCatalog();
  const counts = new Map<string, number>();
  products.forEach((p) => counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1));

  return (
    <div className="bg-page px-5 pb-20 pt-10 sm:px-8 lg:px-14">
      <h1 className="text-center text-[32px] font-bold tracking-[-0.02em] lg:text-[44px]">Shop by Brand</h1>
      <p className="mx-auto mt-3 max-w-[640px] text-center text-[16px] text-muted">
        Our own Volae collection alongside the technical brands we love, all in one bag.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link key={b.id} href={`/brands/${b.slug}`} className="group bg-white">
            <span className="relative block aspect-[4/3] overflow-hidden bg-tile">
              {b.image && (
                <Image
                  src={b.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
              {b.logo && (
                <span className="absolute left-5 top-5 block size-16 overflow-hidden rounded-full bg-white">
                  <Image src={b.logo} alt="" fill sizes="64px" className="object-contain p-2" />
                </span>
              )}
            </span>
            <span className="block p-6">
              <span className="flex items-center justify-between text-[22px] font-bold tracking-[-0.01em]">
                {b.name}
                <ArrowRight />
              </span>
              <span className="mt-2 block text-[15px] leading-relaxed text-muted">{b.description}</span>
              <span className="mt-3 block text-[14px] font-semibold">{counts.get(b.id) ?? 0} products</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
