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

## Data (JSON)

- `seed/*.json`: katalog contoh (5 brand, 28 kategori, 30 produk). Dibuat ulang dengan `npm run generate-seed`.
- `data/*.json`: data aktif. Dibuat otomatis dari `seed/` saat pertama kali ada perubahan.
  - `brands.json`, `categories.json`, `products.json`
  - `orders.json`: setiap checkout WhatsApp
  - `subscribers.json`: pendaftar Email Signup
- `storage/uploads/`: foto yang diunggah lewat admin.
- `npm run reset-data` menghapus `data/` sehingga toko kembali ke data contoh.

Backup cukup dengan menyalin folder `data/` dan `storage/`.

## Multi-brand

- Setiap produk punya satu brand. Brand dikelola di **Admin → Brand** (nama, deskripsi, logo, banner, urutan).
- Brand tampil di menu **Brands**, halaman `/brands` dan `/brands/[slug]`, di atas nama produk, serta sebagai filter di setiap listing.
- Brand yang masih punya produk tidak bisa dihapus.

## Checkout via WhatsApp

1. Pembeli mengisi bag lalu klik **Checkout via WhatsApp** dan mengisi nama, nomor WhatsApp, dan alamat.
2. Server menghitung ulang harga dari katalog, menyimpan pesanan ke `data/orders.json` dengan nomor seperti `VL261029001`.
3. Pembeli diarahkan ke WhatsApp dengan pesan pesanan yang sudah terisi.
4. Di **Admin → Pesanan** Anda bisa melihat detail, menghubungi pembeli, dan mengubah status (Baru → Dikonfirmasi → Dibayar → Dikirim → Selesai).

## Admin

- Buka `/admin` (atau "Sign In" di header).
- Login sementara: **admin** / **12345**, di-hardcode di `src/lib/auth.ts`. Ganti sebelum dipakai publik.
- Set env `ADMIN_SECRET` di production untuk menandatangani cookie login.

Di admin:
- **Produk**: brand, kategori, harga & harga diskon, deskripsi, fitur, aktivitas, warna (tiap warna bisa dipasangkan ke fotonya), ukuran, maks. 8 foto, badge (`Bestseller` otomatis masuk halaman Bestsellers), What's New, aktif/nonaktif.
- **Kategori**: kategori utama = menu atas (Women, Men, Accessories, Bags); sub-kategori tampil di mega menu.

## Halaman toko

| URL | Isi |
| --- | --- |
| `/` | Beranda: hero, carousel produk, kategori, brand, promo |
| `/c/[slug]` | Kategori dengan filter (Category, Brand, Size, Colour, Activity) dan sort |
| `/brands`, `/brands/[slug]` | Daftar brand dan produk per brand |
| `/whats-new`, `/bestsellers`, `/sale` | Koleksi; tambahkan `?dept=women` untuk satu departemen |
| `/search?q=` | Pencarian |
| `/p/[slug]` | Detail produk |
| `/cart`, `/wishlist` | Bag dan wish list (tersimpan di browser) |

## Catatan desain

Layout, warna, dan tipografi mengikuti lululemon.com. Logo, nama, foto produk, dan teks diganti dengan milik volae.
Font memakai Hanken Grotesk (open source) sebagai pengganti Calibre. Foto produk contoh adalah ilustrasi
placeholder (`public/placeholder`); ganti dengan foto asli lewat admin (rasio 5:6 paling pas). Foto banner dari Unsplash,
lihat `public/images/CREDITS.md`.
