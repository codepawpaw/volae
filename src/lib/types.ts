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
  customer: { name: string; phone: string; address: string; note: string };
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

/** The product carousel right under the homepage hero. Products come from these categories (and their sub-categories). */
export type HomeFeatured = { title: string; categoryIds: string[] };

export type Settings = { homeFeatured: HomeFeatured };

export type Database = {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  subscribers: Subscriber[];
  orders: Order[];
  settings: Settings;
};

export type CategoryNode = Category & { children: Category[] };
