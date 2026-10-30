import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ListingView";
import { CollectionListing } from "../collection";

export const metadata: Metadata = { title: "We Made Too Much" };

export default function SalePage({ searchParams }: PageProps<"/sale">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionListing kind="sale" searchParams={searchParams} />
    </Suspense>
  );
}
