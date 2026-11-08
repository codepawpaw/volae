"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { AreaSearch } from "@/components/AreaSearch";
import { ProductImage } from "@/components/ProductImage";
import { useStore } from "@/components/StoreProvider";
import { MAX_QTY, itemKey } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import type { Area } from "@/lib/biteship";
import { getShippingRates, placeOrder, resolveCart, type CartProductInfo, type ShippingRatesResult } from "../actions";

const fieldClass = "h-[48px] w-full border border-line bg-white px-4 text-[15px] outline-none focus:border-black";

export function CartView() {
  const { items, count, setQty, remove } = useStore();
  // Server data, tagged with the product ids it was fetched for.
  const [resolved, setResolved] = useState<{ ids: string; map: Map<string, CartProductInfo> } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [area, setArea] = useState<Area | null>(null);
  // Courier quote, tagged with the area + bag it was fetched for.
  const [rates, setRates] = useState<{ key: string; result: ShippingRatesResult } | null>(null);
  const [ratesNonce, setRatesNonce] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
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
  const subtotal = orderable.reduce((sum, l) => sum + l.unitPrice * l.item.qty, 0);
  const orderLines = orderable.map(({ item }) => ({ productId: item.productId, color: item.color, size: item.size, qty: item.qty }));
  const linesKey = JSON.stringify(orderLines);
  const ratesKey = area && !loading && orderLines.length ? `${area.id}|${linesKey}|${ratesNonce}` : null;
  const ratesResult = rates && rates.key === ratesKey ? rates.result : null;
  const ratesLoading = !!ratesKey && !ratesResult;
  const options = ratesResult?.ok ? ratesResult.options : [];
  const option = options.find((o) => o.id === optionId) ?? null;
  const total = subtotal + (option?.price ?? 0);

  useEffect(() => {
    if (!ratesKey || !area) return;
    let cancelled = false;
    getShippingRates(area.id, JSON.parse(linesKey))
      .catch(() => ({ ok: false as const, error: "We could not load shipping options. Please try again." }))
      .then((result) => {
        if (cancelled) return;
        setRates({ key: ratesKey, result });
        // Keep the picked courier if it is still offered, otherwise preselect the cheapest.
        if (result.ok) setOptionId((id) => (result.options.some((o) => o.id === id) ? id : (result.options[0]?.id ?? null)));
      });
    return () => {
      cancelled = true;
    };
  }, [ratesKey, area, linesKey]);

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

  const submit = (formData: FormData) => {
    setError(null);
    if (!area) return setError("Please choose your district or postal code from the list.");
    if (!option) return setError("Please choose a shipping option.");
    startTransition(async () => {
      const result = await placeOrder({
        customer: {
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          address: String(formData.get("address") ?? ""),
          note: String(formData.get("note") ?? ""),
        },
        shipping: { areaId: area.id, areaName: area.name, postalCode: area.postalCode, optionId: option.id, price: option.price },
        lines: orderLines,
      });
      if (!result.ok) {
        setError(result.error);
        if (result.refreshRates) setRatesNonce((n) => n + 1);
        return;
      }
      // The bag is emptied on the success page, so it survives a failed or abandoned payment.
      setRedirecting(true);
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
            <dd>{loading ? "…" : formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Shipping</dt>
            <dd className="text-right">
              {option ? formatPrice(option.price) : <span className="text-muted">{checkingOut ? "Choose below" : "Calculated at checkout"}</span>}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-[18px] font-semibold">
            <dt>{option ? "Total" : "Estimated Total"}</dt>
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
            <Lock className="size-5" strokeWidth={1.6} />
            Checkout
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
            <input
              name="email"
              type="email"
              maxLength={254}
              placeholder="Email for receipt (optional)"
              aria-label="Email"
              autoComplete="email"
              className={fieldClass}
            />
            <p className="pt-3 text-[15px] font-semibold">Shipping address</p>
            <AreaSearch
              value={area}
              onChange={(next) => {
                setArea(next);
                setOptionId(null);
              }}
              label="District, city or postal code"
              placeholder="District, city or postal code"
              emptyText="No matching area. Try your district (kecamatan) or postal code."
              inputClassName={fieldClass}
            />
            <textarea
              name="address"
              required
              rows={3}
              maxLength={500}
              placeholder="Street, house number, RT/RW, building"
              aria-label="Street address"
              autoComplete="street-address"
              className={`${fieldClass} h-auto py-3`}
            />
            <input name="note" maxLength={500} placeholder="Note for the courier (optional)" aria-label="Note" className={fieldClass} />

            <fieldset className="space-y-2 pt-3">
              <legend className="pb-2 text-[15px] font-semibold">Shipping method</legend>
              {!area ? (
                <p className="text-[14px] text-muted">Choose your district to see couriers and prices.</p>
              ) : ratesLoading ? (
                <p className="text-[14px] text-muted">Checking couriers…</p>
              ) : ratesResult && !ratesResult.ok ? (
                <div className="text-[14px] text-brand">
                  <p role="alert">{ratesResult.error}</p>
                  <button type="button" onClick={() => setRatesNonce((n) => n + 1)} className="mt-1 underline underline-offset-4">
                    Try again
                  </button>
                </div>
              ) : (
                options.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 border px-4 py-3 text-[15px] ${
                      o.id === optionId ? "border-black" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingOption"
                      value={o.id}
                      checked={o.id === optionId}
                      onChange={() => setOptionId(o.id)}
                      className="mt-1 size-4 accent-black"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {o.courierName} {o.serviceName}
                      </span>
                      {o.duration && <span className="block text-[13px] text-muted">Estimated {o.duration}</span>}
                    </span>
                    <span className="whitespace-nowrap">{formatPrice(o.price)}</span>
                  </label>
                ))
              )}
            </fieldset>
            {error && (
              <p role="alert" className="text-[14px] text-brand">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || redirecting || orderable.length === 0 || !option}
              className="flex h-[56px] w-full items-center justify-center gap-2 bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark disabled:opacity-40"
            >
              <Lock className="size-5" strokeWidth={1.6} />
              {pending || redirecting ? "Opening payment…" : option ? `Pay ${formatPrice(total)}` : "Choose shipping"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-[14px] leading-relaxed text-muted">
          Pay securely with Midtrans: bank transfer, QRIS, e-wallets or card.
        </p>
      </aside>
    </div>
  );
}
