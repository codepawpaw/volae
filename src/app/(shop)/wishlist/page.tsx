import type { Metadata } from "next";
import { cardBrands } from "@/lib/card-brands";
import { getCatalog } from "@/lib/catalog";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { title: "Wish List" };

export default async function WishlistPage() {
  const { brands, products } = await getCatalog();
  return (
    <div className="bg-page px-5 pb-20 pt-10 sm:px-8 lg:px-14">
      <h1 className="text-center text-[32px] font-bold tracking-[-0.02em] lg:text-[44px]">Wish List</h1>
      <WishlistView products={products} brands={cardBrands(brands)} />
    </div>
  );
}
