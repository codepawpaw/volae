"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog";
import { addSubscriber, countOrdersWithPrefix, insertOrder, setOrderPaymentLink, transaction } from "@/lib/db";
import type { Area } from "@/lib/biteship";
import { createSnapTransaction } from "@/lib/midtrans";
import { AREA_ID_PATTERN, findAreas, quoteShipping } from "@/lib/shipping";
import type { Order } from "@/lib/types";

export type SubscribeState = { ok: boolean; message: string } | null;

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = z.email().max(254).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };
  const email = parsed.data;
  await addSubscriber(email);
  return { ok: true, message: "Thanks for signing up! Watch your inbox." };
}

export type CartProductInfo = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  salePrice: number | null;
  colors: string[];
  sizes: string[];
};

/** Current data for the products in a cart, so prices are never trusted from the browser. */
export async function resolveCart(productIds: string[]): Promise<CartProductInfo[]> {
  const ids = new Set(z.array(z.string().max(100)).max(200).parse(productIds));
  const { products, brands } = await getCatalog();
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  return products
    .filter((p) => ids.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: brandName.get(p.brandId) ?? "",
      price: p.price,
      salePrice: p.salePrice,
      colors: p.colors.map((c) => c.name),
      sizes: p.sizes,
    }));
}

// ---------- Shipping ----------

/** District / postal code suggestions for the checkout address (Biteship Maps). */
export async function searchShippingAreas(input: string): Promise<Area[]> {
  const q = z.string().trim().min(3).max(100).safeParse(input);
  if (!q.success) return [];
  try {
    return await findAreas(q.data);
  } catch (error) {
    console.error("[biteship] area search failed", error);
    return [];
  }
}

const lineSchema = z.object({
  productId: z.string().max(100),
  color: z.string().max(60),
  size: z.string().max(30),
  qty: z.number().int().min(1).max(10),
});
const linesSchema = z.array(lineSchema).min(1, "Your bag is empty.").max(50);

type PricedLines = { ok: true; lines: Order["lines"] } | { ok: false; error: string };

/** Turns cart lines into order lines with current catalogue prices and weights. */
async function priceLines(lines: z.infer<typeof linesSchema>): Promise<PricedLines> {
  const { products, brands } = await getCatalog();
  const productById = new Map(products.map((p) => [p.id, p]));
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  const priced: Order["lines"] = [];
  for (const line of lines) {
    const product = productById.get(line.productId);
    const colorOk = !product?.colors.length || product.colors.some((c) => c.name === line.color);
    if (!product || !colorOk || !product.sizes.includes(line.size)) {
      return { ok: false, error: "Some items in your bag are no longer available. Please remove them and try again." };
    }
    priced.push({
      productId: product.id,
      name: product.name,
      brand: brandName.get(product.brandId) ?? "",
      color: line.color,
      size: line.size,
      qty: line.qty,
      unitPrice: product.salePrice ?? product.price,
      weight: product.weight,
    });
  }
  return { ok: true, lines: priced };
}

export type ShippingOptionInfo = {
  id: string;
  courierName: string;
  serviceName: string;
  description: string;
  duration: string;
  price: number;
};
export type ShippingRatesResult = { ok: true; options: ShippingOptionInfo[] } | { ok: false; error: string };

const areaIdSchema = z.string().regex(AREA_ID_PATTERN, "Please choose your district from the list.");

/** Courier options for the bag to the chosen area. */
export async function getShippingRates(areaId: string, lines: CheckoutInput["lines"]): Promise<ShippingRatesResult> {
  const parsed = z.object({ areaId: areaIdSchema, lines: linesSchema }).safeParse({ areaId, lines });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const priced = await priceLines(parsed.data.lines);
  if (!priced.ok) return priced;
  try {
    const options = await quoteShipping(parsed.data.areaId, priced.lines);
    if (!options.length) return { ok: false, error: "No courier delivers to this area. Please check the district." };
    return {
      ok: true,
      options: options.map(({ id, courierName, serviceName, description, duration, price }) => ({
        id,
        courierName,
        serviceName,
        description,
        duration,
        price,
      })),
    };
  } catch (error) {
    console.error("[biteship] rates failed", error);
    return { ok: false, error: "We could not load shipping options. Please try again in a moment." };
  }
}

// ---------- Checkout ----------

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Please enter your name.").max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,20}$/, "Please enter a valid phone number."),
    // Optional; Midtrans emails payment instructions and receipts here.
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .refine((v) => v === "" || z.email().safeParse(v).success, "Please enter a valid email address."),
    address: z.string().trim().min(1, "Please enter your shipping address.").max(500),
    note: z.string().trim().max(500),
  }),
  shipping: z.object({
    areaId: areaIdSchema,
    areaName: z.string().trim().min(1, "Please choose your district from the list.").max(200),
    postalCode: z.string().trim().regex(/^(\d{5})?$/),
    /** ShippingOptionInfo.id, e.g. "jne:reg". */
    optionId: z.string().min(1, "Please choose a shipping option.").max(80),
    /** The price the buyer saw, so a changed rate is never charged silently. */
    price: z.number().int().min(0),
  }),
  lines: linesSchema,
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; url: string; number: string }
  | { ok: false; error: string; refreshRates?: boolean };

/**
 * Saves the order using current catalogue prices and a fresh Biteship shipping quote, opens a
 * Midtrans Snap transaction for it and returns the Midtrans payment page to send the buyer to.
 */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order." };
  const { customer, shipping, lines } = parsed.data;

  const priced = await priceLines(lines);
  if (!priced.ok) return priced;
  const orderLines = priced.lines;

  // The buyer picked from an earlier quote; the price is taken from a fresh one.
  let option;
  try {
    option = (await quoteShipping(shipping.areaId, orderLines)).find((o) => o.id === shipping.optionId);
  } catch (error) {
    console.error("[biteship] rates failed at checkout", error);
    return { ok: false, error: "We could not confirm the shipping cost. Please try again in a moment." };
  }
  if (!option) return { ok: false, error: "This shipping option is no longer available. Please choose another one." };
  if (option.price !== shipping.price) {
    return { ok: false, error: "The shipping cost has just changed. Please check the updated price and try again.", refreshRates: true };
  }

  const subtotal = orderLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const now = new Date();
  const order = await transaction(async (tx) => {
    const today = now.toISOString().slice(2, 10).replace(/-/g, "");
    const todayCount = await countOrdersWithPrefix(tx, `VL${today}`);
    const created: Order = {
      id: `o_${randomUUID()}`,
      number: `VL${today}${String(todayCount + 1).padStart(3, "0")}`,
      customer,
      lines: orderLines,
      subtotal,
      total: subtotal + option.price,
      status: "new",
      payment: { status: "unpaid", type: null, redirectUrl: null, expiresAt: null, paidAt: null },
      shipping: {
        areaId: shipping.areaId,
        areaName: shipping.areaName,
        postalCode: shipping.postalCode,
        courierCode: option.courierCode,
        serviceCode: option.serviceCode,
        courierName: option.courierName,
        serviceName: option.serviceName,
        duration: option.duration,
        cost: option.price,
        weight: orderLines.reduce((sum, l) => sum + l.weight * l.qty, 0),
        shipment: { id: null, status: null, trackingId: null, waybillId: null, trackingUrl: null, price: null, updatedAt: null },
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    await insertOrder(tx, created);
    return created;
  });

  try {
    const snap = await createSnapTransaction(order);
    await setOrderPaymentLink(order.id, snap.redirectUrl, snap.expiresAt);
    return { ok: true, url: snap.redirectUrl, number: order.number };
  } catch (error) {
    console.error(`[midtrans] could not start payment for ${order.number}`, error);
    return { ok: false, error: "We could not start the payment. Please try again in a moment." };
  }
}
