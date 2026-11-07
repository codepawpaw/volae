export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  image: string | null;
  order: number;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  image: string | null;
  order: number;
  createdAt: string;
};

/** `image` is the product photo shown when this colour is selected. */
export type ProductColor = { name: string; hex: string; image: string | null };

export type Product = {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  price: number;
  salePrice: number | null;
  description: string;
  features: string[];
  colors: ProductColor[];
  sizes: string[];
  activities: string[];
  images: string[];
  badge: string | null;
  isNew: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Subscriber = { email: string; createdAt: string };

export const ORDER_STATUSES = ["new", "confirmed", "paid", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "expired", "cancelled", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Online payment through Midtrans. */
export type OrderPayment = {
  status: PaymentStatus;
  /** Midtrans payment_type, e.g. bank_transfer, gopay, qris, credit_card. */
  type: string | null;
  /** Snap payment page; usable until expiresAt. */
  redirectUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
};

export type OrderLine = {
  /** null once the product has been deleted; the rest of the line is a snapshot. */
  productId: string | null;
  name: string;
  brand: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  number: string;
  customer: { name: string; phone: string; email: string; address: string; note: string };
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  payment: OrderPayment;
  createdAt: string;
  updatedAt: string;
};

/** The product carousel right under the homepage hero. Products come from these categories (and their sub-categories). */
export type HomeFeatured = { title: string; categoryIds: string[] };

/** Categories shown in the header menu, in tree order. `null` shows every top-level category. */
export type HeaderSettings = { categoryIds: string[] | null };

export type LinkSetting = { label: string; href: string };

/** The "Shop by category" tiles on the homepage, in tree order. `null` shows every top-level category. */
export type ShopByCategory = { title: string; categoryIds: string[] | null };

/** The "Shop by brand" carousel on the homepage, in brand order. `null` shows every brand. */
export type ShopByBrand = { title: string; brandIds: string[] | null };

/** The "What's new" product carousel on the homepage. Empty `categoryIds` shows every new product. */
export type HomeWhatsNew = { title: string; categoryIds: string[] };

/** Products on the Bestsellers page and homepage carousel. `null` (never saved) uses products badged "Bestseller". */
export type BestsellerSettings = { title: string; productIds: string[] | null };

export type FooterColumn = { title: string; links: LinkSetting[] };

export const MAX_FOOTER_COLUMNS = 4;

export type Settings = {
  homeFeatured: HomeFeatured;
  header: HeaderSettings;
  heroLinks: LinkSetting[];
  shopByCategory: ShopByCategory;
  shopByBrand: ShopByBrand;
  homeWhatsNew: HomeWhatsNew;
  bestsellers: BestsellerSettings;
  /** Footer link columns after the automatic Shop column. */
  footerColumns: FooterColumn[];
};

export type Database = {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  subscribers: Subscriber[];
  orders: Order[];
  settings: Settings;
};

/** Department › group › sub-category, e.g. Sports › Tennis › Overgrip. */
export const MAX_CATEGORY_DEPTH = 3;

export type CategoryNode = Category & { children: CategoryNode[] };
