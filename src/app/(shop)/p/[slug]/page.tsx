import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductDetail } from "@/components/ProductDetail";
import { cardBrands } from "@/lib/card-brands";
import { departmentOf, getCatalog } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default function ProductPage(props: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent({ params, searchParams }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const { color } = await searchParams;
  const { brands, categories, products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const brandMap = cardBrands(brands);
  const brand = brands.find((b) => b.id === product.brandId);
  const category = categories.find((c) => c.id === product.categoryId);
  const department = departmentOf(categories, product.categoryId);
  const initialColor = Math.max(0, product.colors.findIndex((c) => c.name === color));
  const related = products
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || departmentOf(categories, p.categoryId)?.id === department?.id))
    .slice(0, 8);
  const sameBrand = products.filter((p) => p.id !== product.id && p.brandId === product.brandId).slice(0, 8);

  const crumbs = [
    { label: "Home", href: "/" },
    ...(department && department.id !== category?.id ? [{ label: department.name, href: `/c/${department.slug}` }] : []),
    ...(category ? [{ label: category.name, href: `/c/${category.slug}` }] : []),
  ];

  return (
    <>
      <div className="px-5 pb-16 pt-5 sm:px-8 lg:px-14">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-muted">
          <ol className="flex flex-wrap gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                <Link href={c.href} className="hover:underline">
                  {c.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <ProductDetail product={product} brand={brandMap[product.brandId] ?? null} initialColor={initialColor} />
      </div>

      <section className="border-t border-line px-5 py-14 sm:px-8 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Why we made this</h2>
            <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed">{product.description}</p>
          </div>
          {product.features.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Features</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px]">
                {product.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {brand && (
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">About {brand.name}</h2>
              <p className="mt-4 text-[16px] leading-relaxed">{brand.description}</p>
              <Link href={`/brands/${brand.slug}`} className="mt-3 inline-block text-[15px] font-semibold underline underline-offset-4">
                Shop all {brand.name}
              </Link>
            </div>
          )}
        </div>
        {product.activities.length > 0 && (
          <p className="mt-10 text-[15px] text-muted">
            Designed for:{" "}
            {product.activities.map((a, i) => (
              <span key={a}>
                {i > 0 && ", "}
                {department ? (
                  <Link href={`/c/${department.slug}?activity=${encodeURIComponent(a)}`} className="text-ink underline underline-offset-2">
                    {a}
                  </Link>
                ) : (
                  a
                )}
              </span>
            ))}
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section className="bg-page px-5 py-14 sm:px-8 lg:px-14">
          <h2 className="text-center text-[26px] font-bold tracking-[-0.01em] lg:text-[32px]">You may also like</h2>
          <div className="mt-10">
            <ProductCarousel products={related} brands={brandMap} />
          </div>
        </section>
      )}
      {brand && sameBrand.length > 0 && (
        <section className="px-5 py-14 sm:px-8 lg:px-14">
          <h2 className="text-center text-[26px] font-bold tracking-[-0.01em] lg:text-[32px]">More from {brand.name}</h2>
          <div className="mt-10">
            <ProductCarousel products={sameBrand} brands={brandMap} />
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1fr_480px] lg:px-14">
      <div className="aspect-[5/6] bg-tile lg:max-h-[860px]" />
      <div className="space-y-5">
        <div className="h-8 w-3/4 bg-tile" />
        <div className="h-6 w-1/3 bg-tile" />
        <div className="mt-10 h-[56px] w-full bg-tile" />
      </div>
    </div>
  );
}
