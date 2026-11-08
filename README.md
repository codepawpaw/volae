# volae — toko online multi-brand (Next.js)

Storefront bergaya lululemon.com dengan panel admin untuk brand, kategori, produk, dan pesanan.
Data disimpan di Supabase Postgres. Pembayaran lewat Midtrans Snap, pengiriman lewat Biteship.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
```

Production (perlu server sendiri / VPS, karena data disimpan sebagai file):

```bash
npm run build
ADMIN_SECRET="isi-dengan-string-acak-panjang" npm start
```

## Pengaturan toko

Ubah `src/config/site.ts`:
- `whatsappNumber`: nomor tujuan checkout (format internasional tanpa "+", mis. `6281234567890`).
- `announcements`: teks berganti di bar paling atas.
- `heroSlides` dan `heroLinks`: banner dan link di beranda (gambar di `public/images`).
- `activities`: daftar aktivitas (Running, Yoga, dst.) untuk filter dan menu.

## Data (Supabase Postgres)

Semua data tersimpan di Postgres Supabase dan diakses lewat `src/lib/db.ts` memakai `DATABASE_URL`.

- Skema: `supabase/migrations/`. Tabel `brands`, `categories`, `products`, `orders` + `order_items`, `subscribers`, `settings`.
- `seed/*.json`: katalog contoh (5 brand, 28 kategori, 30 produk). Dibuat ulang dengan `npm run generate-seed`,
  lalu `npm run db:seed-sql` untuk memperbarui `supabase/seed.sql`.
- Menjalankan migration + seed: `npm run db:push -- --db-url "$DATABASE_URL"` (Supabase CLI).
- `storage/uploads/`: foto yang diunggah lewat admin (masih di disk lokal).

Environment variable:

- `DATABASE_URL`: connection string pooler Supabase, mis.
  `postgresql://postgres.<ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: login admin. Login ditolak jika salah satunya kosong.
- `ADMIN_SECRET`: kunci penanda tangan sesi admin.

Untuk lokal, isi variabel di atas di `.env.local`.

## Multi-brand

- Setiap produk punya satu brand. Brand dikelola di **Admin → Brand** (nama, deskripsi, logo, banner, urutan).
- Brand tampil di menu **Brands**, halaman `/brands` dan `/brands/[slug]`, di atas nama produk, serta sebagai filter di setiap listing.
- Brand yang masih punya produk tidak bisa dihapus.

## Pembayaran (Midtrans Snap)

1. Pembeli mengisi bag, klik **Checkout**, lalu mengisi nama, nomor WhatsApp, email (opsional), kecamatan/kode pos,
   alamat, dan memilih kurir (lihat **Pengiriman** di bawah).
2. Server menghitung ulang harga dan ongkir, menyimpan pesanan (`VL261107001`), membuat transaksi Snap dengan nomor
   pesanan sebagai `order_id`, lalu mengarahkan pembeli ke halaman pembayaran Midtrans (berlaku 24 jam).
3. Setelah membayar, Midtrans mengarahkan ke `/finish-payment`, yang mengecek status ke API Midtrans lalu
   meneruskan ke `/success-payment` (lunas / menunggu pembayaran) atau `/failed-payment`.
4. Midtrans mengirim notifikasi ke `/api/midtrans/notification`. Signature diverifikasi, status diambil ulang
   dari API Midtrans, lalu pesanan diperbarui: lunas → **Dibayar**, kedaluwarsa/dibatalkan → **Dibatalkan**.
   Semua notifikasi tercatat di tabel `payment_notifications`.
5. `/api/midtrans/recurring-notification` dan `/api/midtrans/account-linking` sudah aktif dan mencatat
   notifikasi (toko belum memakai langganan atau GoPay account linking).

Environment variable (lihat `.env`): `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `MIDTRANS_FINISH_URL`,
`MIDTRANS_SUCCESS_URL`, `MIDTRANS_FAILED_URL`, `MIDTRANS_NOTIFICATION_URL` (dikirim sebagai
`X-Override-Notification`), dan opsional `MIDTRANS_SIGNATURE_KEY` (server key lain yang juga diterima saat
memverifikasi signature notifikasi).

Di dashboard Midtrans (Settings → Payment): Finish URL `https://volae.id/finish-payment`, Unfinish & Error URL
`https://www.volae.id/failed-payment`, dan ketiga notification URL di atas.

## Pengiriman (Biteship)

Dokumentasi API: https://biteship.com/id/docs/intro. Kode: `src/lib/biteship.ts` (klien API), `src/lib/shipping.ts`.

1. **Admin → Pengiriman**: isi alamat pengirim (lokasi pickup, kecamatan dicari lewat Biteship Maps) dan kurir yang
   ditawarkan di checkout. Tanpa alamat pengirim, checkout tidak bisa menghitung ongkir.
2. **Admin → Produk**: isi *Berat kirim (gram)* per produk (default 500 g). Ongkir dihitung dari total berat.
3. Di checkout, pembeli mengetik kecamatan / kode pos, memilih dari daftar, lalu memilih kurir dan layanan
   (`POST /v1/rates/couriers`). Ongkir dihitung ulang di server saat pesanan dibuat. Kalau harganya berubah,
   pembeli diminta mengecek ulang. Ongkir masuk ke total dan ke `item_details` Midtrans.
4. Setelah pesanan **lunas**, klik **Buat pengiriman** di **Admin → Pesanan** untuk memesan pickup kurir
   (`POST /v1/orders`, `reference_id` = nomor pesanan, jadi klik ganda tidak memesan dua kali). Dengan API key
   `biteship_live.*` ini pickup sungguhan dan memotong saldo Biteship. Pengiriman bisa dibatalkan selama kurir
   belum mengambil paket, lalu dibuat ulang.
5. Biteship mengirim webhook ke `/api/biteship/webhook` (event `order.status`, `order.price`, `order.waybill_id`).
   Status diambil ulang dari API Biteship, lalu pesanan diperbarui: paket diambil kurir → **Dikirim**,
   terkirim → **Selesai**. Semua webhook tercatat di tabel `shipping_notifications`.
6. Pembeli melacak paket di `/track` dengan nomor pesanan + nomor WhatsApp.

Environment variable: `BITESHIP_API_KEY` (`biteship_test.*` untuk simulasi, `biteship_live.*` untuk produksi).

Di dashboard Biteship: **Integrasi → Webhook → Tambah Webhook**, URL `https://volae.id/api/biteship/webhook`,
centang ketiga event. Pastikan saldo cukup: Rates API menolak permintaan kalau saldo kosong.

## Admin

- Buka `/admin` (atau "Sign In" di header).
- Login sementara: **admin** / **12345**, di-hardcode di `src/lib/auth.ts`. Ganti sebelum dipakai publik.
- Set env `ADMIN_SECRET` di production untuk menandatangani cookie login.

Di admin:
- **Produk**: brand, kategori, harga & harga diskon, deskripsi, fitur, aktivitas, warna (tiap warna bisa dipasangkan ke fotonya), ukuran, maks. 8 foto, badge (`Bestseller` otomatis masuk halaman Bestsellers), What's New, aktif/nonaktif.
- **Kategori**: kategori utama = menu atas (Women, Men, Accessories, Bags); sub-kategori tampil di mega menu.
- **Beranda**: judul dan kategori produk untuk carousel pertama di bawah banner beranda.

## Halaman toko

| URL | Isi |
| --- | --- |
| `/` | Beranda: hero, carousel produk, kategori, brand, promo |
| `/c/[slug]` | Kategori dengan filter (Category, Brand, Size, Colour, Activity) dan sort |
| `/brands`, `/brands/[slug]` | Daftar brand dan produk per brand |
| `/sports` | Semua produk yang punya aktivitas; `?activity=Running` untuk satu aktivitas |
| `/whats-new`, `/bestsellers`, `/sale` | Koleksi; tambahkan `?dept=women` untuk satu departemen |
| `/search?q=` | Pencarian |
| `/p/[slug]` | Detail produk |
| `/cart`, `/wishlist` | Bag dan wish list (tersimpan di browser) |

## Catatan desain

Layout, warna, dan tipografi mengikuti lululemon.com. Logo, nama, foto produk, dan teks diganti dengan milik volae.
Font memakai Hanken Grotesk (open source) sebagai pengganti Calibre. Foto produk contoh adalah ilustrasi
placeholder (`public/placeholder`); ganti dengan foto asli lewat admin (rasio 5:6 paling pas). Foto banner dari Unsplash,
lihat `public/images/CREDITS.md`.
