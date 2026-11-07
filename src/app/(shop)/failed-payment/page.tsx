import type { Metadata } from "next";
import { Suspense } from "react";
import { FailedResult, loadOrder, ResultSkeleton } from "../payment-result";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false } };

// Failed page URL: https://www.volae.id/failed-payment?order=VL…
// Also works as the Unfinish / Error redirect URL in the Midtrans dashboard (?order_id=VL…).
export default function FailedPaymentPage(props: PageProps<"/failed-payment">) {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <Result {...props} />
    </Suspense>
  );
}

async function Result({ searchParams }: PageProps<"/failed-payment">) {
  return <FailedResult order={await loadOrder(searchParams)} />;
}
