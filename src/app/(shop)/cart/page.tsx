import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your Bag" };

export default function CartPage() {
  return (
    <div className="bg-page px-5 pb-20 pt-8 sm:px-8 lg:px-14 lg:pt-12">
      <CartView />
    </div>
  );
}
