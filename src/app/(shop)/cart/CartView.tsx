"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useStore } from "@/components/StoreProvider";
import { MAX_QTY, itemKey } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { placeOrder, resolveCart, type CartProductInfo } from "../actions";

const fieldClass = "h-[48px] w-full border border-line bg-white px-4 text-[15px] outline-none focus:border-black";

export function CartView() {
  const { items, count, setQty, remove, clear } = useStore();
  // Server data, tagged with the product ids it was fetched for.
  const [resolved, setResolved] = useState<{ ids: string; map: Map<string, CartProductInfo> } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ number: string; url: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const ids = useMemo(() => [...new Set(items.map((i) => i.productId))].sort().join(","), [items]);

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    resolveCart(ids.split(","))
      .then((list) => {
        if (cancelled) return;
        setResolved({ ids, map: new Map(list.map((p) => [p.id, p])) });
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (placed) {
    return (
      <div className="mx-auto max-w-[560px] bg-white px-6 py-14 text-center sm:px-12">
        <h1 className="text-[28px] font-semibold">Thank you!</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          Your order <span className="font-semibold text-ink">{placed.number}</span> has been saved. Send it to us on WhatsApp so we
          can confirm stock, shipping and payment.
        </p>
        <a
          href={placed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-8 flex h-[56px] max-w-[340px] items-center justify-center gap-2 bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark"
        >
          <MessageCircle className="size-5" strokeWidth={1.6} />
          Send via WhatsApp
        </a>
        <Link href="/" className="mt-5 inline-block text-[15px] underline underline-offset-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[560px] bg-white px-6 py-16 text-center">
        <h1 className="text-[28px] font-semibold">Your bag is empty.</h1>
        <p className="mt-3 text-muted">Once you add something to your bag, it will appear here. Ready to get started?</p>
        <Link
          href="/whats-new"
          className="mx-auto mt-8 flex h-[56px] max-w-[300px] items-center justify-center bg-black text-[13px] font-bold uppercase tracking-[0.14em] text-white"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const info = resolved?.ids === ids ? resolved.map : null;
  const loading = !info && !loadError;
  // Prices always come from the server; an item is unavailable when its product,
  // colour or size no longer exists.
  const lines = items.map((item) => {
    const product = info?.get(item.productId);
    const available =
      !!product && product.sizes.includes(item.size) && (product.colors.length === 0 || product.colors.includes(item.color));
    const unitPrice = product ? (product.salePrice ?? product.price) : item.unitPrice;
    return { item, available, unitPrice };
  });
  const orderable = lines.filter((l) => l.available);
  const hasUnavailable = !loading && orderable.length !== lines.length;
  const total = orderable.reduce((sum, l) => sum + l.unitPrice * l.item.qty, 0);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        customer: {
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          address: String(formData.get("address") ?? ""),
          note: String(formData.get("note") ?? ""),
        },
        lines: orderable.map(({ item }) => ({ productId: item.productId, color: item.color, size: item.size, qty: item.qty })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clear();
      setPlaced({ number: result.number, url: result.url });
      window.location.assign(result.url);
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
      <div>
        <h1 className="text-[28px] font-semibold lg:text-[32px]">
          Your Bag <span className="font-normal text-muted">({count} {count === 1 ? "item" : "items"})</span>
        </h1>
        <ul className="mt-6 space-y-4">
          {lines.map(({ item, available, unitPrice }) => {
            const key = itemKey(item);
            return (
              <li key={key} className={`flex gap-5 bg-white p-5 ${available || loading ? "" : "opacity-60"}`}>
                <Link href={`/p/${item.slug}?color=${encodeURIComponent(item.color)}`} className="relative aspect-[5/6] w-[110px] shrink-0 bg-tile sm:w-[150px]">
                  <ProductImage src={item.image} alt={item.name} sizes="150px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
                    <div className="min-w-0">
                      {item.brand && <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-subtle">{item.brand}</p>}
                      <Link href={`/p/${item.slug}`} className="text-[17px] font-semibold leading-snug hover:underline">
                        {item.name}
                      </Link>
                    </div>
                    <p className="text-[17px]">{formatPrice(unitPrice * item.qty)}</p>
                  </div>
                  <p className="mt-2 text-[15px]">{item.color}</p>
                  <p className="text-[15px]">Size {item.size}</p>
                  {!loading && !available && (
                    <p className="mt-2 text-[14px] text-brand">No longer available. Please remove this item.</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-5 pt-4">
                    <label className="flex items-center gap-2 text-[15px]">
                      Quantity
                      <select
                        value={item.qty}
                        onChange={(e) => setQty(key, Number(e.target.value))}
                        className="h-[40px] border border-line bg-white px-3 text-[15px]"
                      >
                        {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => remove(key)} className="text-[15px] underline underline-offset-4">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit bg-white p-6 lg:sticky lg:top-[96px] lg:mt-[62px]">
        <h2 className="text-[22px] font-semibold">Order Summary</h2>
        <dl className="mt-6 space-y-3 text-[16px]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{loading ? "…" : formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>FREE</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-[18px] font-semibold">
            <dt>Estimated Total</dt>
            <dd>{loading ? "…" : formatPrice(total)}</dd>
          </div>
        </dl>

        {loadError && (
          <p role="alert" className="mt-5 text-[14px] text-brand">
            Could not check current prices. Please refresh the page.
          </p>
        )}
        {hasUnavailable && (
          <p role="alert" className="mt-5 text-[14px] text-brand">
            Unavailable items will not be included in your order.
          </p>
        )}

        {!checkingOut ? (
          <button
            type="button"
            disabled={loading || loadError || orderable.length === 0}
            onClick={() => setCheckingOut(true)}
            className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark disabled:opacity-40"
          >
            <MessageCircle className="size-5" strokeWidth={1.6} />
            Checkout via WhatsApp
          </button>
        ) : (
          <form action={submit} className="mt-6 space-y-3">
            <p className="text-[15px] font-semibold">Your details</p>
            <input name="name" required maxLength={100} placeholder="Full name" aria-label="Full name" autoComplete="name" className={fieldClass} />
            <input
              name="phone"
              required
              type="tel"
              maxLength={20}
              placeholder="WhatsApp number"
              aria-label="WhatsApp number"
              autoComplete="tel"
              className={fieldClass}
            />
            <textarea
              name="address"
              rows={3}
              maxLength={500}
              placeholder="Shipping address (optional)"
              aria-label="Shipping address"
              autoComplete="street-address"
              className={`${fieldClass} h-auto py-3`}
            />
            <input name="note" maxLength={500} placeholder="Note (optional)" aria-label="Note" className={fieldClass} />
            {error && (
              <p role="alert" className="text-[14px] text-brand">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || orderable.length === 0}
              className="flex h-[56px] w-full items-center justify-center gap-2 bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark disabled:opacity-40"
            >
              <MessageCircle className="size-5" strokeWidth={1.6} />
              {pending ? "Sending…" : "Send Order via WhatsApp"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-[14px] leading-relaxed text-muted">
          Your order is sent to our team on WhatsApp to confirm stock, shipping and payment.
        </p>
      </aside>
    </div>
  );
}
