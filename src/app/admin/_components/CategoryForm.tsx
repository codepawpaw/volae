"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { Category } from "@/lib/types";
import { saveCategory } from "../actions";
import { Field, FormError, inputClass, primaryButton, secondaryButton, textareaClass } from "./ui";

type Props = { category?: Category; parents: Category[]; hasChildren: boolean };

export function CategoryForm({ category, parents, hasChildren }: Props) {
  const [state, formAction, pending] = useActionState(saveCategory, null);
  const [preview, setPreview] = useState<string | null>(null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form
      // Submitting manually keeps the entered values if the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-2xl space-y-6 bg-white p-6 sm:p-8"
    >
      <FormError message={state?.error} />
      {category && <input type="hidden" name="id" value={category.id} />}

      <Field label="Nama kategori" htmlFor="name" error={errors.name}>
        <input id="name" name="name" required maxLength={60} defaultValue={category?.name} className={inputClass} />
      </Field>

      <Field
        label="Kategori induk"
        htmlFor="parentId"
        error={errors.parentId}
        hint={
          hasChildren
            ? "Kategori ini punya sub-kategori, jadi harus tetap kategori utama."
            : "Kosongkan untuk kategori utama (tampil di menu atas). Pilih induk untuk sub-kategori (tampil di dropdown)."
        }
      >
        <select
          id="parentId"
          name="parentId"
          defaultValue={category?.parentId ?? ""}
          disabled={hasChildren}
          className={inputClass}
        >
          <option value="">— Kategori utama —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Deskripsi" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={category?.description}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Gambar banner"
        htmlFor="image"
        error={errors.image}
        hint="JPG, PNG, atau WEBP, maksimal 5MB. Tampil di sisi kiri halaman kategori."
      >
        <div className="flex items-start gap-5">
          {(preview ?? category?.image) && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of an unsaved file
            <img src={preview ?? category?.image ?? ""} alt="" className="size-24 shrink-0 bg-tile object-cover" />
          )}
          <div className="space-y-3">
            <input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="block text-[14px] file:mr-4 file:rounded-full file:border file:border-line file:bg-white file:px-5 file:py-2 file:text-[14px]"
            />
            {category?.image && (
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" name="removeImage" className="size-4 accent-ink" />
                Hapus gambar saat ini
              </label>
            )}
          </div>
        </div>
      </Field>

      <Field label="Urutan" htmlFor="order" error={errors.order} hint="Angka kecil tampil lebih dulu.">
        <input
          id="order"
          name="order"
          type="number"
          min={0}
          max={999}
          defaultValue={category?.order ?? 0}
          className={`${inputClass} max-w-[140px]`}
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/admin/categories" className={secondaryButton}>
          Batal
        </Link>
      </div>
    </form>
  );
}
