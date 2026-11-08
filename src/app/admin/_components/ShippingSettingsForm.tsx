"use client";

import { startTransition, useActionState, useState } from "react";
import { AreaSearch } from "@/components/AreaSearch";
import type { Area } from "@/lib/biteship";
import { COURIER_OPTIONS } from "@/lib/couriers";
import type { ShippingSettings } from "@/lib/types";
import { saveShippingSettings } from "../actions";
import { Field, FormError, inputClass, primaryButton, textareaClass } from "./ui";

export function ShippingSettingsForm({ settings }: { settings: ShippingSettings }) {
  const [state, formAction, pending] = useActionState(saveShippingSettings, null);
  const errors = state?.fieldErrors ?? {};
  const { origin, couriers } = settings;
  const [area, setArea] = useState<Area | null>(
    origin ? { id: origin.areaId, name: origin.areaName, postalCode: origin.postalCode } : null,
  );

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
      <h2 className="text-[18px] font-semibold">Alamat pengirim (lokasi pickup)</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nama kontak" htmlFor="contactName" error={errors.contactName}>
          <input id="contactName" name="contactName" required maxLength={100} defaultValue={origin?.contactName} className={inputClass} />
        </Field>
        <Field label="Telepon kontak" htmlFor="contactPhone" error={errors.contactPhone} hint="Dihubungi kurir saat pickup.">
          <input
            id="contactPhone"
            name="contactPhone"
            required
            type="tel"
            maxLength={20}
            defaultValue={origin?.contactPhone}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Kecamatan / kode pos"
        htmlFor="area"
        error={errors.areaId ?? errors.areaName ?? errors.postalCode}
        hint="Ketik minimal 3 huruf, lalu pilih dari daftar."
      >
        <AreaSearch
          id="area"
          value={area}
          onChange={setArea}
          label="Kecamatan / kode pos"
          placeholder="mis. Pesanggrahan atau 12250"
          emptyText="Tidak ditemukan. Coba nama kecamatan atau kode pos."
          inputClassName={inputClass}
        />
        <input type="hidden" name="areaId" value={area?.id ?? ""} />
        <input type="hidden" name="areaName" value={area?.name ?? ""} />
        <input type="hidden" name="postalCode" value={area?.postalCode ?? ""} />
      </Field>

      <Field label="Alamat lengkap" htmlFor="address" error={errors.address} hint="Jalan, nomor, gedung. Dicetak di label kurir.">
        <textarea
          id="address"
          name="address"
          required
          rows={3}
          maxLength={500}
          defaultValue={origin?.address}
          className={textareaClass}
        />
      </Field>

      <Field label="Catatan untuk kurir (opsional)" htmlFor="note" error={errors.note}>
        <input id="note" name="note" maxLength={200} defaultValue={origin?.note} className={inputClass} />
      </Field>

      <Field label="Kurir di checkout" error={errors.couriers} hint="Hanya kurir yang aktif di akun Biteship Anda yang akan muncul.">
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
          {COURIER_OPTIONS.map((c) => (
            <label key={c.code} className="flex items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                name="couriers"
                value={c.code}
                defaultChecked={couriers.includes(c.code)}
                className="size-4 accent-ink"
              />
              {c.name}
            </label>
          ))}
        </div>
      </Field>

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
