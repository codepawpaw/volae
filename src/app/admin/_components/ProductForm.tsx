"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { Plus, Star, Trash2, X } from "lucide-react";
import { site } from "@/config/site";
import type { Product } from "@/lib/types";
import { saveProduct } from "../actions";
import { Field, FormError, inputClass, primaryButton, secondaryButton, textareaClass } from "./ui";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const MAX_IMAGES = 8;

type Option = { id: string; label: string };
type Props = { product?: Product; categories: Option[]; brands: Option[] };

let colorKey = 0;
// `image` is the URL (or local preview URL) of the photo shown for this colour.
const newColor = (name = "", hex = "#1c1c1c", image: string | null = null) => ({ key: ++colorKey, name, hex, image });

export function ProductForm({ product, categories, brands }: Props) {
  const [state, formAction, pending] = useActionState(saveProduct, null);
  const errors = state?.fieldErrors ?? {};

  const [colors, setColors] = useState(() =>
    product?.colors.length ? product.colors.map((c) => newColor(c.name, c.hex, c.image)) : [newColor()],
  );
  const [existingImages, setExistingImages] = useState(product?.images ?? []);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const customSizes = (product?.sizes ?? []).filter((s) => !PRESET_SIZES.includes(s)).join(", ");
  const totalImages = existingImages.length + newPreviews.length;
  const allImages = [...existingImages, ...newPreviews];

  const clearNewFiles = () => {
    if (fileInput.current) fileInput.current.value = "";
    setNewPreviews([]);
  };

  return (
    <form
      // Submitting manually keeps the entered values if the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-3xl space-y-6 bg-white p-6 sm:p-8"
    >
      <FormError message={state?.error} />
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Nama produk" htmlFor="name" error={errors.name}>
        <input id="name" name="name" required maxLength={120} defaultValue={product?.name} className={inputClass} />
      </Field>

      <Field label="Brand" htmlFor="brandId" error={errors.brandId}>
        <select id="brandId" name="brandId" required defaultValue={product?.brandId ?? ""} className={inputClass}>
          <option value="" disabled>
            Pilih brand
          </option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId}>
        <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className={inputClass}>
          <option value="" disabled>
            Pilih kategori
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Harga (Rp)" htmlFor="price" error={errors.price} hint="Contoh: 1999000">
          <input
            id="price"
            name="price"
            required
            inputMode="numeric"
            defaultValue={product?.price}
            className={inputClass}
          />
        </Field>
        <Field label="Harga diskon (Rp, opsional)" htmlFor="salePrice" error={errors.salePrice} hint="Kosongkan jika tidak diskon.">
          <input
            id="salePrice"
            name="salePrice"
            inputMode="numeric"
            defaultValue={product?.salePrice ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label="Berat kirim (gram)"
          htmlFor="weight"
          error={errors.weight}
          hint="Berat per pcs termasuk kemasan, untuk ongkir. Contoh: 800"
        >
          <input
            id="weight"
            name="weight"
            required
            inputMode="numeric"
            defaultValue={product?.weight ?? 500}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Deskripsi" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={product?.description}
          className={textareaClass}
        />
      </Field>

      <Field label="Fitur (opsional)" htmlFor="features" error={errors.features} hint="Satu fitur per baris, mis. Sweat-wicking.">
        <textarea
          id="features"
          name="features"
          rows={4}
          defaultValue={product?.features.join("\n")}
          className={textareaClass}
        />
      </Field>

      <Field label="Aktivitas" error={errors.activities} hint="Dipakai untuk filter Activity dan menu.">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {site.activities.map((a) => (
            <label key={a} className="flex items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                name="activities"
                value={a}
                defaultChecked={product?.activities.includes(a)}
                className="size-4 accent-ink"
              />
              {a}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Warna" error={errors.colors} hint="Pilih foto untuk tiap warna; foto itu tampil saat warna dipilih di toko.">
        <div className="space-y-3">
          {colors.map((c, i) => (
            <div key={c.key} className="flex items-center gap-3">
              <input
                type="color"
                name="colorHex"
                value={c.hex}
                onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                aria-label={`Kode warna ${i + 1}`}
                className="h-[44px] w-[52px] shrink-0 cursor-pointer rounded-full border border-line bg-white p-1"
              />
              <input
                name="colorName"
                required
                maxLength={40}
                placeholder="Nama warna, mis. True Navy"
                value={c.name}
                onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                aria-label={`Nama warna ${i + 1}`}
                className={inputClass}
              />
              <input type="hidden" name="colorImage" value={c.image ? allImages.indexOf(c.image) : -1} />
              <select
                value={c.image && allImages.includes(c.image) ? c.image : ""}
                onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, image: e.target.value || null } : x)))}
                aria-label={`Foto warna ${i + 1}`}
                className={`${inputClass} max-w-[130px] px-4`}
              >
                <option value="">Tanpa foto</option>
                {allImages.map((src, n) => (
                  <option key={src} value={src}>
                    Foto {n + 1}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setColors(colors.filter((_, j) => j !== i))}
                disabled={colors.length === 1}
                aria-label="Hapus warna"
                className="p-2 text-muted hover:text-red-700 disabled:opacity-30"
              >
                <Trash2 className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
          {colors.length < 20 && (
            <button
              type="button"
              onClick={() => setColors([...colors, newColor()])}
              className="inline-flex items-center gap-2 text-[14px] underline"
            >
              <Plus className="size-4" /> Tambah warna
            </button>
          )}
        </div>
      </Field>

      <Field label="Ukuran" error={errors.sizes}>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {PRESET_SIZES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                name="sizes"
                value={s}
                defaultChecked={product?.sizes.includes(s)}
                className="size-4 accent-ink"
              />
              {s}
            </label>
          ))}
        </div>
        <input
          name="customSizes"
          defaultValue={customSizes}
          placeholder="Ukuran lain, pisahkan dengan koma (mis. 39, 40, 41 atau 6Y, 8Y)"
          aria-label="Ukuran lain"
          className={`${inputClass} mt-4`}
        />
      </Field>

      <Field
        label={`Foto produk (${totalImages}/${MAX_IMAGES})`}
        error={errors.images}
        hint="JPG, PNG, atau WEBP, maksimal 5MB per foto. Rasio 5:6 (mis. 1000×1200) paling pas. Foto pertama jadi foto utama."
      >
        <div className="flex flex-wrap gap-3">
          {existingImages.map((src, i) => (
            <div key={src} className="relative size-28 bg-tile">
              <input type="hidden" name="existingImages" value={src} />
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={src} alt="" className="size-full object-cover" />
              <span className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">
                {i === 0 ? "1 · Utama" : i + 1}
              </span>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => setExistingImages([src, ...existingImages.filter((x) => x !== src)])}
                    aria-label="Jadikan foto utama"
                    title="Jadikan foto utama"
                    className="rounded-full bg-white p-1.5 shadow"
                  >
                    <Star className="size-3.5" />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setExistingImages(existingImages.filter((x) => x !== src))}
                  aria-label="Hapus foto"
                  title="Hapus foto"
                  className="rounded-full bg-white p-1.5 text-red-700 shadow"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {newPreviews.map((src, i) => (
            <div key={src} className="relative size-28 bg-tile">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an unsaved file */}
              <img src={src} alt="" className="size-full object-cover" />
              <span className="absolute left-1 top-1 rounded-full bg-success px-2 py-0.5 text-[11px] text-white">
                {existingImages.length + i + 1} · Baru
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            ref={fileInput}
            name="newImages"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setNewPreviews(files.map((f) => URL.createObjectURL(f)));
            }}
            className="block text-[14px] file:mr-4 file:rounded-full file:border file:border-line file:bg-white file:px-5 file:py-2 file:text-[14px]"
          />
          {newPreviews.length > 0 && (
            <button type="button" onClick={clearNewFiles} className="text-[14px] underline">
              Batalkan foto baru
            </button>
          )}
        </div>
        {totalImages > MAX_IMAGES && (
          <p className="mt-2 text-[13px] text-red-700">Maksimal {MAX_IMAGES} foto. Kurangi pilihan foto.</p>
        )}
      </Field>

      <Field label="Badge (opsional)" htmlFor="badge" error={errors.badge} hint='Contoh: "Bestseller" atau "Online Exclusive". Produk dengan badge "Bestseller" tampil di halaman Bestsellers.'>
        <input id="badge" name="badge" maxLength={40} defaultValue={product?.badge ?? ""} className={inputClass} />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-[15px]">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew ?? true} className="size-4 accent-ink" />
          Tampilkan di &quot;What&apos;s New&quot;
        </label>
        <label className="flex items-center gap-2 text-[15px]">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-ink" />
          Aktif (tampil di toko)
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={pending || totalImages > MAX_IMAGES} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/admin/products" className={secondaryButton}>
          Batal
        </Link>
      </div>
    </form>
  );
}
