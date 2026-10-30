import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ListingView";
import { CollectionListing } from "../collection";

export const metadata: Metadata = { title: "Bestsellers" };

export default function BestsellersPage({ searchParams }: PageProps<"/bestsellers">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionListing kind="bestsellers" searchParams={searchParams} />
    </Suspense>
  );
}
