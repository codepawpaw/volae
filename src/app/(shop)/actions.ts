"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog";
import { addSubscriber, countOrdersWithPrefix, insertOrder, setOrderPaymentLink, transaction } from "@/lib/db";
import { createSnapTransaction } from "@/lib/midtrans";
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
  lines: z
    .array(
      z.object({
        productId: z.string().max(100),
        color: z.string().max(60),
        size: z.string().max(30),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your bag is empty.")
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult = { ok: true; url: string; number: string } | { ok: false; error: string };

/**
 * Saves the order using current catalogue prices, opens a Midtrans Snap transaction for it and
 * returns the Midtrans payment page to send the buyer to.
 */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order." };
  const { customer, lines } = parsed.data;

  const { products, brands } = await getCatalog();
  const productById = new Map(products.map((p) => [p.id, p]));
  const brandName = new Map(brands.map((b) => [b.id, b.name]));

  const orderLines: Order["lines"] = [];
  for (const line of lines) {
    const product = productById.get(line.productId);
    const colorOk = !product?.colors.length || product.colors.some((c) => c.name === line.color);
    if (!product || !colorOk || !product.sizes.includes(line.size)) {
      return { ok: false, error: "Some items in your bag are no longer available. Please remove them and try again." };
    }
    orderLines.push({
      productId: product.id,
      name: product.name,
      brand: brandName.get(product.brandId) ?? "",
      color: line.color,
      size: line.size,
      qty: line.qty,
      unitPrice: product.salePrice ?? product.price,
    });
  }

  const now = new Date();
  const order = await transaction(async (tx) => {
    const today = now.toISOString().slice(2, 10).replace(/-/g, "");
    const todayCount = await countOrdersWithPrefix(tx, `VL${today}`);
    const created: Order = {
      id: `o_${randomUUID()}`,
      number: `VL${today}${String(todayCount + 1).padStart(3, "0")}`,
      customer,
      lines: orderLines,
      total: orderLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
      status: "new",
      payment: { status: "unpaid", type: null, redirectUrl: null, expiresAt: null, paidAt: null },
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
