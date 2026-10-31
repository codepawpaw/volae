import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCarousel } from "@/components/ProductCarousel";
import { site } from "@/config/site";
import { cardBrands } from "@/lib/card-brands";
import { buildCategoryTree, categoryScope, getCatalog, getSettings } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export default async function HomePage() {
  const [{ brands, categories, products }, { homeFeatured, heroLinks }] = await Promise.all([getCatalog(), getSettings()]);
  const brandMap = cardBrands(brands);
  const departments = buildCategoryTree(categories);
  const featuredIds = new Set(homeFeatured.categoryIds.flatMap((id) => [...categoryScope(categories, id)]));

  const featured = products.filter((p) => featuredIds.has(p.categoryId));
  const bestsellers = products.filter((p) => p.badge === "Bestseller");
  const whatsNew = products.filter((p) => p.isNew);
  const sale = products.filter((p) => p.salePrice !== null);

  return (
    <>
      <Hero title={site.brandName} links={heroLinks} slides={site.heroSlides} />

      <ProductSection
        title={homeFeatured.title}
        products={featured.length ? featured : products.slice(0, 8)}
        brands={brandMap}
      />

      <section className="px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
        <h2 className="text-center text-[26px] font-bold tracking-[-0.01em] lg:text-[34px]">Shop by category</h2>
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {departments.map((d) => (
            <Link key={d.id} href={`/c/${d.slug}`} className="group">
              <span className="relative block aspect-[5/6] overflow-hidden bg-tile">
                {d.image && (
                  <Image
                    src={d.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </span>
              <span className="mt-4 flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] group-hover:underline">
                Shop {d.name}
                <ArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {bestsellers.length > 0 && <ProductSection title="Bestsellers you keep coming back to." products={bestsellers} brands={brandMap} />}

      <section className="px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[26px] font-bold tracking-[-0.01em] lg:text-[34px]">Shop by brand</h2>
          <Link href="/brands" className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] hover:underline">
            All Brands <ArrowRight />
          </Link>
        </div>
        <div className="no-scrollbar mt-8 flex gap-5 overflow-x-auto">
          {brands.map((b) => (
            <Link key={b.id} href={`/brands/${b.slug}`} className="group w-[70%] shrink-0 sm:w-[40%] lg:w-[calc((100%-80px)/5)]">
              <span className="relative block aspect-square overflow-hidden bg-tile">
                {b.image && (
                  <Image
                    src={b.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, 70vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <span className="absolute inset-0 bg-black/25" />
                <span className="absolute inset-x-0 bottom-5 text-center text-[24px] font-bold tracking-[-0.02em] text-white">
                  {b.name}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {sale.length > 0 && (
        <section className="relative mx-5 overflow-hidden bg-black sm:mx-8 lg:mx-14">
          <div className="relative h-[460px] lg:h-[520px]">
            <Image src="/images/sale.jpg" alt="" fill sizes="100vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-y-0 left-6 flex max-w-[520px] flex-col justify-center text-white lg:left-14">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em]">We Made Too Much</p>
              <h2 className="mt-3 text-[44px] font-semibold leading-[0.95] tracking-[-0.03em] lg:text-[64px]">
                Last chance styles.
              </h2>
              <p className="mt-4 text-[17px]">Limited sizes and colours at lower prices, across every brand.</p>
              <Link
                href="/sale"
                className="mt-7 flex h-[54px] w-fit items-center justify-center bg-white px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>
      )}

      {whatsNew.length > 0 && <ProductSection title="Just dropped: what’s new." products={whatsNew} brands={brandMap} />}
    </>
  );
}

function ProductSection({
  title,
  products,
  brands,
}: {
  title: string;
  products: Product[];
  brands: ReturnType<typeof cardBrands>;
}) {
  return (
    <section className="bg-page px-5 py-14 sm:px-8 lg:px-[66px] lg:py-[72px]">
      <h2 className="mx-auto max-w-[1100px] text-center text-[26px] font-bold leading-tight tracking-[-0.01em] lg:text-[34px]">
        {title}
      </h2>
      <div className="mt-10 lg:mt-12">
        <ProductCarousel products={products} brands={brands} />
      </div>
    </section>
  );
}
