import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/catalog";
import { ShippingSettingsForm } from "../../_components/ShippingSettingsForm";
import { Notice, PageHeader } from "../../_components/ui";

export const metadata: Metadata = { title: "Pengiriman" };

export default async function ShippingSettingsPage({ searchParams }: PageProps<"/admin/shipping">) {
  await requireAdmin();
  const [params, { shipping }] = await Promise.all([searchParams, getSettings()]);
  const liveKey = process.env.BITESHIP_API_KEY?.startsWith("biteship_live.") ?? false;
  return (
    <>
      <PageHeader title="Pengiriman" />
      {params.saved && <Notice>Pengaturan pengiriman berhasil disimpan.</Notice>}
      <div className="-mt-4 mb-6 max-w-2xl space-y-2 text-[14px] text-muted">
        <p>
          Ongkir dihitung oleh Biteship dari alamat pengirim di bawah ke kecamatan pembeli, memakai berat produk. Pembeli
          memilih kurir saat checkout dan ongkir ditambahkan ke total pembayaran.
        </p>
        <p>
          Setelah pesanan lunas, buka <strong>Pesanan</strong> lalu klik <strong>Buat pengiriman</strong> untuk memesan pickup
          kurir. Status dan nomor resi diperbarui otomatis lewat webhook Biteship.
        </p>
        {!process.env.BITESHIP_API_KEY ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">BITESHIP_API_KEY belum diisi di environment.</p>
        ) : liveKey ? (
          <p className="rounded-xl bg-[#fdf4e3] px-4 py-3 text-[#8a5a00]">
            Memakai API key <strong>live</strong>: setiap “Buat pengiriman” memesan pickup sungguhan dan memotong saldo Biteship.
          </p>
        ) : (
          <p className="rounded-xl bg-[#eef2fb] px-4 py-3 text-[#2b4a8a]">Memakai API key test: pengiriman hanya simulasi.</p>
        )}
      </div>
      <ShippingSettingsForm settings={shipping} />
    </>
  );
}
