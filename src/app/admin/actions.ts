"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { CATALOG_TAG, categoryPath, categoryScope, subtreeHeight } from "@/lib/catalog";
import {
  deleteRow,
  listBrands,
  listCategories,
  listProducts,
  saveSetting,
  setOrderStatus,
  transaction,
  upsertBrand,
  upsertCategory,
  upsertProduct,
} from "@/lib/db";
import { slugify } from "@/lib/format";
import { MAX_CATEGORY_DEPTH, ORDER_STATUSES, type Brand, type Category, type Product } from "@/lib/types";
import { deleteImages, filesFrom, saveImage, validateImage } from "@/lib/uploads";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | null;

const MAX_IMAGES = 8;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = base || "item";
  let slug = root;
  for (let i = 2; used.has(slug); i++) slug = `${root}-${i}`;
  return slug;
}

/** Saves new uploads, removing them again if `commit` throws or reports a failure. */
async function withUploads<T>(
  files: File[],
  commit: (urls: string[]) => Promise<T>,
  failed: (result: T) => boolean,
): Promise<T> {
  const urls: string[] = [];
  try {
    for (const file of files) urls.push(await saveImage(file));
    const result = await commit(urls);
    if (failed(result)) await deleteImages(urls);
    return result;
  } catch (error) {
    await deleteImages(urls);
    throw error;
  }
}

// ---------- Auth ----------

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!checkCredentials(text(formData, "username"), String(formData.get("password") ?? ""))) {
    return { error: "Username atau password salah." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Categories ----------

const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi.").max(60, "Maksimal 60 karakter."),
  parentId: z.string().max(100).transform((v) => v || null),
  description: z.string().max(500, "Maksimal 500 karakter."),
  order: z.coerce.number({ error: "Urutan harus berupa angka." }).int("Urutan harus bilangan bulat.").min(0).max(999),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = categorySchema.safeParse({
    name: text(formData, "name"),
    parentId: text(formData, "parentId"),
    description: text(formData, "description"),
    order: text(formData, "order") || "0",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const [imageFile] = filesFrom(formData, "image");
  if (imageFile) {
    const imageError = await validateImage(imageFile);
    if (imageError) return { fieldErrors: { image: imageError } };
  }
  const removeImage = formData.get("removeImage") === "on";

  const outcome = await withUploads(imageFile ? [imageFile] : [], (urls) =>
    transaction(async (tx): Promise<FormState | { oldImage: string | null }> => {
      const categories = await listCategories(tx);
      const existing = id ? categories.find((c) => c.id === id) : undefined;
      if (id && !existing) return { error: "Kategori tidak ditemukan. Mungkin sudah dihapus." };

      let parent: Category | undefined;
      if (data.parentId) {
        parent = categories.find((c) => c.id === data.parentId);
        if (!parent) return { fieldErrors: { parentId: "Kategori induk tidak ditemukan." } };
        if (id && categoryScope(categories, id).has(parent.id)) {
          return { fieldErrors: { parentId: "Kategori tidak bisa dipindah ke dalam dirinya sendiri atau sub-kategorinya." } };
        }
        const depth = categoryPath(categories, parent.id).length + 1 + (id ? subtreeHeight(categories, id) : 0);
        if (depth > MAX_CATEGORY_DEPTH) {
          return { fieldErrors: { parentId: `Struktur kategori maksimal ${MAX_CATEGORY_DEPTH} level.` } };
        }
      }

      const base = parent ? `${parent.slug}-${slugify(data.name)}` : slugify(data.name);
      const others = categories.filter((c) => c.id !== id);
      const keepSlug = existing && existing.name === data.name && existing.parentId === data.parentId;
      const slug = keepSlug ? existing.slug : uniqueSlug(base, others.map((c) => c.slug));

      const oldImage = existing?.image ?? null;
      const image = urls[0] ?? (removeImage ? null : oldImage);
      const category: Category = {
        id: existing?.id ?? `c_${randomUUID()}`,
        name: data.name,
        slug,
        parentId: data.parentId,
        description: data.description,
        image,
        order: data.order,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await upsertCategory(tx, category);
      return { oldImage: oldImage !== image ? oldImage : null };
    }),
    (result) => !result || !("oldImage" in result),
  );

  if (outcome && !("oldImage" in outcome)) return outcome;
  if (outcome?.oldImage) await deleteImages([outcome.oldImage]);
  updateTag(CATALOG_TAG);
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const result = await transaction(async (tx): Promise<FormState | { image: string | null }> => {
    const categories = await listCategories(tx);
    const products = await listProducts(tx);
    const category = categories.find((c) => c.id === id);
    if (!category) return { error: "Kategori tidak ditemukan." };
    const productCount = products.filter((p) => p.categoryId === id).length;
    if (productCount > 0) {
      return { error: `Tidak bisa dihapus: masih ada ${productCount} produk di kategori ini. Pindahkan atau hapus produknya dulu.` };
    }
    if (categories.some((c) => c.parentId === id)) {
      return { error: "Tidak bisa dihapus: kategori ini masih punya sub-kategori." };
    }
    await deleteRow(tx, "categories", id);
    return { image: category.image };
  });
  if (result && !("image" in result)) return result;
  if (result?.image) await deleteImages([result.image]);
  updateTag(CATALOG_TAG);
  redirect("/admin/categories?deleted=1");
}

// ---------- Brands ----------

const brandSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi.").max(60, "Maksimal 60 karakter."),
  description: z.string().max(500, "Maksimal 500 karakter."),
  order: z.coerce.number({ error: "Urutan harus berupa angka." }).int("Urutan harus bilangan bulat.").min(0).max(999),
});

export async function saveBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = brandSchema.safeParse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    order: text(formData, "order") || "0",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // Logo and banner are both optional single images.
  const [logoFile] = filesFrom(formData, "logo");
  const [imageFile] = filesFrom(formData, "image");
  for (const [field, file] of [["logo", logoFile], ["image", imageFile]] as const) {
    if (!file) continue;
    const imageError = await validateImage(file);
    if (imageError) return { fieldErrors: { [field]: imageError } };
  }
  const files = [logoFile, imageFile].filter((f): f is File => !!f);

  const outcome = await withUploads(files, (urls) =>
    transaction(async (tx): Promise<FormState | { removed: string[] }> => {
      const brands = await listBrands(tx);
      const existing = id ? brands.find((b) => b.id === id) : undefined;
      if (id && !existing) return { error: "Brand tidak ditemukan. Mungkin sudah dihapus." };

      const uploaded = [...urls];
      const newLogo = logoFile ? uploaded.shift()! : null;
      const newImage = imageFile ? uploaded.shift()! : null;
      const logo = newLogo ?? (formData.get("removeLogo") === "on" ? null : (existing?.logo ?? null));
      const image = newImage ?? (formData.get("removeImage") === "on" ? null : (existing?.image ?? null));

      const others = brands.filter((b) => b.id !== id);
      const slug =
        existing && existing.name === data.name ? existing.slug : uniqueSlug(slugify(data.name), others.map((b) => b.slug));
      const brand: Brand = {
        id: existing?.id ?? `b_${randomUUID()}`,
        name: data.name,
        slug,
        description: data.description,
        logo,
        image,
        order: data.order,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await upsertBrand(tx, brand);
      const before = [existing?.logo ?? null, existing?.image ?? null];
      return { removed: before.filter((url): url is string => !!url && url !== logo && url !== image) };
    }),
    (result) => !result || !("removed" in result),
  );

  if (outcome && !("removed" in outcome)) return outcome;
  if (outcome?.removed.length) await deleteImages(outcome.removed);
  updateTag(CATALOG_TAG);
  redirect("/admin/brands?saved=1");
}

export async function deleteBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const result = await transaction(async (tx): Promise<FormState | { images: string[] }> => {
    const brands = await listBrands(tx);
    const products = await listProducts(tx);
    const brand = brands.find((b) => b.id === id);
    if (!brand) return { error: "Brand tidak ditemukan." };
    const productCount = products.filter((p) => p.brandId === id).length;
    if (productCount > 0) {
      return { error: `Tidak bisa dihapus: masih ada ${productCount} produk dari brand ini. Pindahkan atau hapus produknya dulu.` };
    }
    await deleteRow(tx, "brands", id);
    return { images: [brand.logo, brand.image].filter((url): url is string => !!url) };
  });
  if (result && !("images" in result)) return result;
  if (result?.images.length) await deleteImages(result.images);
  updateTag(CATALOG_TAG);
  redirect("/admin/brands?deleted=1");
}

// ---------- Products ----------

const rupiah = (label: string) =>
  z
    .string()
    .transform((v) => v.replace(/[.,\s]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d+$/, `${label} harus berupa angka.`)
        .transform(Number)
        .pipe(z.number().int().min(1, `${label} minimal Rp1.`).max(10_000_000_000, `${label} terlalu besar.`)),
    );

const productSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi.").max(120, "Maksimal 120 karakter."),
    brandId: z.string().min(1, "Pilih brand."),
    categoryId: z.string().min(1, "Pilih kategori."),
    price: rupiah("Harga"),
    salePrice: z.union([z.literal("").transform(() => null), rupiah("Harga diskon")]),
    description: z.string().max(5000, "Maksimal 5000 karakter."),
    features: z.array(z.string().max(120, "Setiap fitur maksimal 120 karakter.")).max(12, "Maksimal 12 fitur."),
    activities: z.array(z.string().max(40)).max(20),
    colors: z
      .array(
        z.object({
          name: z.string().min(1, "Setiap warna harus punya nama.").max(40, "Nama warna maksimal 40 karakter."),
          hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Kode warna tidak valid."),
          imageIndex: z.number().int().min(-1),
        }),
      )
      .min(1, "Tambahkan minimal satu warna.")
      .max(20, "Maksimal 20 warna."),
    sizes: z
      .array(z.string().min(1).max(20, "Ukuran maksimal 20 karakter."))
      .min(1, "Pilih minimal satu ukuran.")
      .max(30, "Maksimal 30 ukuran."),
    badge: z.string().max(40, "Badge maksimal 40 karakter.").transform((v) => v || null),
    isNew: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((d) => d.salePrice === null || d.salePrice < d.price, {
    message: "Harga diskon harus lebih kecil dari harga normal.",
    path: ["salePrice"],
  });

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");

  const colorNames = formData.getAll("colorName").map((v) => String(v).trim());
  const colorHexes = formData.getAll("colorHex").map((v) => String(v).trim());
  // Index into the final image list (kept images first, then new uploads); -1 = none.
  const colorImages = formData.getAll("colorImage").map((v) => Number(v));
  const customSizes = text(formData, "customSizes")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sizes = [...new Set([...formData.getAll("sizes").map((v) => String(v).trim()), ...customSizes])].filter(Boolean);

  const parsed = productSchema.safeParse({
    name: text(formData, "name"),
    brandId: text(formData, "brandId"),
    categoryId: text(formData, "categoryId"),
    price: text(formData, "price"),
    salePrice: text(formData, "salePrice"),
    description: text(formData, "description"),
    features: text(formData, "features")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean),
    activities: formData.getAll("activities").map((v) => String(v).trim()).filter(Boolean),
    colors: colorNames.map((name, i) => ({
      name,
      hex: colorHexes[i] ?? "",
      imageIndex: Number.isInteger(colorImages[i]) ? colorImages[i] : -1,
    })),
    sizes,
    badge: text(formData, "badge"),
    isNew: formData.get("isNew") === "on",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const keptImages = formData.getAll("existingImages").map(String);
  const newFiles = filesFrom(formData, "newImages");
  if (keptImages.length + newFiles.length === 0) return { fieldErrors: { images: "Tambahkan minimal satu foto." } };
  if (keptImages.length + newFiles.length > MAX_IMAGES) {
    return { fieldErrors: { images: `Maksimal ${MAX_IMAGES} foto per produk.` } };
  }
  for (const file of newFiles) {
    const imageError = await validateImage(file);
    if (imageError) return { fieldErrors: { images: imageError } };
  }

  const outcome = await withUploads(newFiles, (urls) =>
    transaction(async (tx): Promise<FormState | { removed: string[] }> => {
      // One query at a time: a transaction runs on a single connection.
      const products = await listProducts(tx);
      const categories = await listCategories(tx);
      const brands = await listBrands(tx);
      const existing = id ? products.find((p) => p.id === id) : undefined;
      if (id && !existing) return { error: "Produk tidak ditemukan. Mungkin sudah dihapus." };
      if (!categories.some((c) => c.id === data.categoryId)) {
        return { fieldErrors: { categoryId: "Kategori tidak ditemukan." } };
      }
      if (!brands.some((b) => b.id === data.brandId)) {
        return { fieldErrors: { brandId: "Brand tidak ditemukan." } };
      }
      // Only images that already belong to this product may be kept.
      const current = existing?.images ?? [];
      if (keptImages.some((url) => !current.includes(url))) {
        return { error: "Data foto tidak valid. Muat ulang halaman lalu coba lagi." };
      }

      const others = products.filter((p) => p.id !== id);
      const slug =
        existing && existing.name === data.name ? existing.slug : uniqueSlug(slugify(data.name), others.map((p) => p.slug));
      const now = new Date().toISOString();
      const images = [...keptImages, ...urls];
      const product: Product = {
        id: existing?.id ?? `p_${randomUUID()}`,
        slug,
        ...data,
        colors: data.colors.map(({ imageIndex, ...c }) => ({ ...c, image: images[imageIndex] ?? null })),
        images,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await upsertProduct(tx, product);
      return { removed: current.filter((url) => !keptImages.includes(url)) };
    }),
    (result) => !result || !("removed" in result),
  );

  if (outcome && !("removed" in outcome)) return outcome;
  if (outcome?.removed.length) await deleteImages(outcome.removed);
  updateTag(CATALOG_TAG);
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const images = await transaction(async (tx) => {
    const product = (await listProducts(tx)).find((p) => p.id === id);
    if (!product) return null;
    await deleteRow(tx, "products", id);
    return product.images;
  });
  if (!images) return { error: "Produk tidak ditemukan." };
  await deleteImages(images);
  updateTag(CATALOG_TAG);
  redirect("/admin/products?deleted=1");
}

// ---------- Homepage ----------

const homeFeaturedSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi.").max(140, "Maksimal 140 karakter."),
  categoryIds: z.array(z.string().max(100)).max(50),
});

export async function saveHomeSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = homeFeaturedSchema.safeParse({
    title: text(formData, "title"),
    categoryIds: formData.getAll("categoryIds").map(String),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  await transaction(async (tx) => {
    // Drop ids of categories that were deleted while the form was open.
    const categories = await listCategories(tx);
    const categoryIds = data.categoryIds.filter((id) => categories.some((c) => c.id === id));
    await saveSetting(tx, "homeFeatured", { title: data.title, categoryIds });
  });
  updateTag(CATALOG_TAG);
  redirect("/admin/home?saved=1");
}

// ---------- Orders ----------

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const status = z.enum(ORDER_STATUSES).safeParse(text(formData, "status"));
  if (!status.success) return;
  await setOrderStatus(id, status.data);
  refresh();
}
