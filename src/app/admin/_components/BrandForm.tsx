"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { Brand } from "@/lib/types";
import { saveBrand } from "../actions";
import { Field, FormError, inputClass, primaryButton, secondaryButton, textareaClass } from "./ui";

const fileClass =
  "block text-[14px] file:mr-4 file:rounded-full file:border file:border-line file:bg-white file:px-5 file:py-2 file:text-[14px]";

function ImageInput({ name, current, removeName }: { name: string; current: string | null; removeName: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="flex items-start gap-5">
      {(preview ?? current) && (
        // eslint-disable-next-line @next/next/no-img-element -- local preview of an unsaved file
        <img src={preview ?? current ?? ""} alt="" className="size-24 shrink-0 bg-tile object-cover" />
      )}
      <div className="space-y-3">
        <input
          id={name}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className={fileClass}
        />
        {current && (
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" name={removeName} className="size-4 accent-ink" />
            Hapus gambar saat ini
          </label>
        )}
      </div>
    </div>
  );
}

export function BrandForm({ brand }: { brand?: Brand }) {
  const [state, formAction, pending] = useActionState(saveBrand, null);
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
      {brand && <input type="hidden" name="id" value={brand.id} />}

      <Field label="Nama brand" htmlFor="name" error={errors.name}>
        <input id="name" name="name" required maxLength={60} defaultValue={brand?.name} className={inputClass} />
      </Field>

      <Field label="Deskripsi" htmlFor="description" error={errors.description} hint="Tampil di halaman brand dan di halaman produk.">
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={brand?.description}
          className={textareaClass}
        />
      </Field>

      <Field label="Logo (opsional)" htmlFor="logo" error={errors.logo} hint="JPG, PNG, atau WEBP, maksimal 5MB. Sebaiknya persegi.">
        <ImageInput name="logo" current={brand?.logo ?? null} removeName="removeLogo" />
      </Field>

      <Field
        label="Gambar banner (opsional)"
        htmlFor="image"
        error={errors.image}
        hint="JPG, PNG, atau WEBP, maksimal 5MB. Tampil di daftar brand, beranda, dan menu Brands."
      >
        <ImageInput name="image" current={brand?.image ?? null} removeName="removeImage" />
      </Field>

      <Field label="Urutan" htmlFor="order" error={errors.order} hint="Angka kecil tampil lebih dulu.">
        <input
          id="order"
          name="order"
          type="number"
          min={0}
          max={999}
          defaultValue={brand?.order ?? 0}
          className={`${inputClass} max-w-[140px]`}
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href="/admin/brands" className={secondaryButton}>
          Batal
        </Link>
      </div>
    </form>
  );
}
