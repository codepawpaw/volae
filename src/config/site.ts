// Ganti nilai di file ini untuk menyesuaikan toko Anda.
export const site = {
  brandName: "volae",
  description: "Technical apparel, outerwear and accessories from Volae and the brands we love.",
  // Nomor WhatsApp toko (link bantuan pembayaran), format internasional tanpa "+" (contoh: 6281234567890).
  whatsappNumber: "6281234567890",
  email: "hello@volae.id",
  region: "Indonesia (IDR)",
  language: "English",

  // Teks berganti di bar paling atas.
  announcements: [
    { text: "Fall 2026 Outerwear is here—explore the styles now.", href: "/c/women-coats-jackets" },
    { text: "Free delivery on every order. Pay securely with QRIS, e-wallet, bank transfer or card.", href: "/cart" },
    { text: "New brands just landed. Shop by brand.", href: "/brands" },
  ],

  // Banner besar di beranda. Gambar disimpan di public/images.
  heroSlides: [
    {
      image: "/images/home.jpg",
      title: "Quiet the\nweather.",
      ctas: [
        { label: "Shop Women's Outerwear", href: "/c/women-coats-jackets" },
        { label: "Shop Men's Outerwear", href: "/c/men-coats-jackets" },
      ],
    },
    {
      image: "/images/story.jpg",
      title: "Made to\nmove.",
      ctas: [{ label: "Shop What's New", href: "/whats-new" }],
    },
    {
      image: "/images/men.jpg",
      title: "Every brand,\none bag.",
      ctas: [{ label: "Shop by Brand", href: "/brands" }],
    },
  ],

  // Link default di samping banner beranda. Bisa diubah di Admin → Beranda.
  heroLinks: [
    { label: "Sports", href: "/sports" },
    { label: "All Women's", href: "/c/women" },
    { label: "All Men's", href: "/c/men" },
    { label: "Accessories", href: "/c/accessories" },
  ],

  // Aktivitas yang bisa dipilih di produk dan tampil di menu.
  activities: ["Running", "Workout", "Casual", "Lounge", "Tennis & Padel", "Golf", "Yoga"],

  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
    youtube: "https://youtube.com/",
  },
} as const;
