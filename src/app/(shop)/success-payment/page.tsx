import type { Metadata } from "next";
import { Suspense } from "react";
import { loadOrder, ResultSkeleton, SuccessResult } from "../payment-result";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

// Success page URL: https://www.volae.id/success-payment?order=VL…
export default function SuccessPaymentPage(props: PageProps<"/success-payment">) {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <Result {...props} />
    </Suspense>
  );
}

async function Result({ searchParams }: PageProps<"/success-payment">) {
  return <SuccessResult order={await loadOrder(searchParams)} />;
}
