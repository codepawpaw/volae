# volae — toko online multi-brand (Next.js)

Storefront bergaya lululemon.com dengan panel admin untuk brand, kategori, produk, dan pesanan.
Data disimpan sebagai file JSON (tanpa database cloud). Checkout diteruskan ke WhatsApp.

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

## Checkout via WhatsApp

1. Pembeli mengisi bag lalu klik **Checkout via WhatsApp** dan mengisi nama, nomor WhatsApp, dan alamat.
2. Server menghitung ulang harga dari katalog, menyimpan pesanan ke database dengan nomor seperti `VL261029001`.
3. Pembeli diarahkan ke WhatsApp dengan pesan pesanan yang sudah terisi.
4. Di **Admin → Pesanan** Anda bisa melihat detail, menghubungi pembeli, dan mengubah status (Baru → Dikonfirmasi → Dibayar → Dikirim → Selesai).

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
