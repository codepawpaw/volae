"use client";

import { Heart } from "lucide-react";
import { useStore } from "./StoreProvider";

export function WishlistButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const saved = wishlist.includes(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wish list` : `Add ${name} to wish list`}
      className={`flex items-center justify-center rounded-full bg-white ${className}`}
    >
      <Heart className={`size-[18px] ${saved ? "fill-brand text-brand" : ""}`} strokeWidth={1.5} />
    </button>
  );
}
