import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ListingView";
import { CollectionListing } from "../collection";

export const metadata: Metadata = { title: "What's New" };

export default function WhatsNewPage({ searchParams }: PageProps<"/whats-new">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionListing kind="whats-new" searchParams={searchParams} />
    </Suspense>
  );
}
