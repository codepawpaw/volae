import "server-only";
import { Pool, types, type PoolClient } from "pg";
import type { Brand, Category, Database, Order, OrderStatus, Product, Settings, Subscriber } from "./types";

// Postgres storage (Supabase). Schema lives in supabase/migrations.

// bigint columns hold rupiah amounts, which fit safely in a JS number.
types.setTypeParser(types.builtins.INT8, Number);
// Keep timestamps as ISO strings, like the rest of the app expects.
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => new Date(value).toISOString());

type Queryable = Pool | PoolClient;

// One pool per server instance (also across hot reloads in dev).
const globalForDb = globalThis as unknown as { __volaePool?: Pool };

function pool(): Pool {
  if (globalForDb.__volaePool) return globalForDb.__volaePool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  // Supabase's certificate is not in Node's CA store. pg would try to verify it whenever the
  // URL carries sslmode, so drop that and encrypt without verification instead.
  const connectionString = new URL(url);
  connectionString.searchParams.delete("sslmode");
  globalForDb.__volaePool = new Pool({
    connectionString: connectionString.toString(),
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
  });
  return globalForDb.__volaePool;
}

/**
 * Runs `fn` inside a database transaction. Writes are serialised with an advisory lock so
 * check-then-write logic (unique slugs, order numbers) cannot race. Rolls back if `fn` throws.
 */
export async function transaction<T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('volae:write'))");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

// ---------- Reads ----------

export async function listBrands(db: Queryable = pool()): Promise<Brand[]> {
  const { rows } = await db.query<Brand>(
    `select id, name, slug, description, logo, image, sort_order as "order", created_at as "createdAt"
     from public.brands order by sort_order, name`,
  );
  return rows;
}

export async function listCategories(db: Queryable = pool()): Promise<Category[]> {
  const { rows } = await db.query<Category>(
    `select id, name, slug, parent_id as "parentId", description, image, sort_order as "order",
       created_at as "createdAt"
     from public.categories order by sort_order, name`,
  );
  return rows;
}

/** All products, newest first. */
export async function listProducts(db: Queryable = pool()): Promise<Product[]> {
  const { rows } = await db.query<Product>(
    `select id, name, slug, brand_id as "brandId", category_id as "categoryId", price, sale_price as "salePrice",
       description, features, colors, sizes, activities, images, badge, is_new as "isNew", is_active as "isActive",
       created_at as "createdAt", updated_at as "updatedAt"
     from public.products order by created_at desc, id`,
  );
  return rows;
}

export async function listSubscribers(db: Queryable = pool()): Promise<Subscriber[]> {
  const { rows } = await db.query<Subscriber>(
    `select email, created_at as "createdAt" from public.subscribers order by created_at desc`,
  );
  return rows;
}

/** All orders with their lines, newest first. */
export async function listOrders(db: Queryable = pool()): Promise<Order[]> {
  const { rows } = await db.query<Order>(
    `select o.id, o.number,
       json_build_object('name', o.customer_name, 'phone', o.customer_phone, 'address', o.customer_address,
         'note', o.customer_note) as customer,
       coalesce(
         (select json_agg(json_build_object('productId', i.product_id, 'name', i.name, 'brand', i.brand,
            'color', i.color, 'size', i.size, 'qty', i.qty, 'unitPrice', i.unit_price) order by i.position)
          from public.order_items i where i.order_id = o.id),
         '[]'
       ) as lines,
       o.total, o.status, o.created_at as "createdAt", o.updated_at as "updatedAt"
     from public.orders o order by o.created_at desc`,
  );
  return rows;
}

export async function readSettings(db: Queryable = pool()): Promise<Partial<Settings>> {
  const { rows } = await db.query<{ key: string; value: unknown }>(`select key, value from public.settings`);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Everything at once. Used by the admin pages. */
export async function readDatabase(): Promise<Database> {
  const [brands, categories, products, subscribers, orders, settings] = await Promise.all([
    listBrands(),
    listCategories(),
    listProducts(),
    listSubscribers(),
    listOrders(),
    readSettings(),
  ]);
  return { brands, categories, products, subscribers, orders, settings: settings as Settings };
}

// ---------- Writes ----------

export async function upsertBrand(tx: PoolClient, b: Brand) {
  await tx.query(
    `insert into public.brands (id, name, slug, description, logo, image, sort_order, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set name = excluded.name, slug = excluded.slug, description = excluded.description,
       logo = excluded.logo, image = excluded.image, sort_order = excluded.sort_order`,
    [b.id, b.name, b.slug, b.description, b.logo, b.image, b.order, b.createdAt],
  );
}

export async function upsertCategory(tx: PoolClient, c: Category) {
  await tx.query(
    `insert into public.categories (id, name, slug, parent_id, description, image, sort_order, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set name = excluded.name, slug = excluded.slug, parent_id = excluded.parent_id,
       description = excluded.description, image = excluded.image, sort_order = excluded.sort_order`,
    [c.id, c.name, c.slug, c.parentId, c.description, c.image, c.order, c.createdAt],
  );
}

export async function upsertProduct(tx: PoolClient, p: Product) {
  await tx.query(
    `insert into public.products (id, name, slug, brand_id, category_id, price, sale_price, description, features,
       colors, sizes, activities, images, badge, is_new, is_active, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     on conflict (id) do update set name = excluded.name, slug = excluded.slug, brand_id = excluded.brand_id,
       category_id = excluded.category_id, price = excluded.price, sale_price = excluded.sale_price,
       description = excluded.description, features = excluded.features, colors = excluded.colors,
       sizes = excluded.sizes, activities = excluded.activities, images = excluded.images, badge = excluded.badge,
       is_new = excluded.is_new, is_active = excluded.is_active`,
    [
      p.id, p.name, p.slug, p.brandId, p.categoryId, p.price, p.salePrice, p.description, p.features,
      // jsonb: pass as JSON text, otherwise pg would send a Postgres array.
      JSON.stringify(p.colors),
      p.sizes, p.activities, p.images, p.badge, p.isNew, p.isActive, p.createdAt, p.updatedAt,
    ],
  );
}

export async function deleteRow(tx: PoolClient, table: "brands" | "categories" | "products", id: string) {
  await tx.query(`delete from public.${table} where id = $1`, [id]);
}

export async function saveSetting<K extends keyof Settings>(tx: PoolClient, key: K, value: Settings[K]) {
  await tx.query(
    `insert into public.settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, JSON.stringify(value)],
  );
}

export async function addSubscriber(email: string) {
  await pool().query(`insert into public.subscribers (email) values ($1) on conflict do nothing`, [email]);
}

/** Order numbers already used on a given day prefix, e.g. "VL261030". */
export async function countOrdersWithPrefix(tx: PoolClient, prefix: string): Promise<number> {
  const { rows } = await tx.query<{ count: number }>(
    `select count(*)::int as count from public.orders where number like $1 || '%'`,
    [prefix],
  );
  return rows[0].count;
}

export async function insertOrder(tx: PoolClient, o: Order) {
  await tx.query(
    `insert into public.orders (id, number, customer_name, customer_phone, customer_address, customer_note, total,
       status, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [o.id, o.number, o.customer.name, o.customer.phone, o.customer.address, o.customer.note, o.total, o.status,
      o.createdAt, o.updatedAt],
  );
  for (const [position, l] of o.lines.entries()) {
    await tx.query(
      `insert into public.order_items (order_id, position, product_id, name, brand, color, size, qty, unit_price)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [o.id, position, l.productId, l.name, l.brand, l.color, l.size, l.qty, l.unitPrice],
    );
  }
}

/** Returns false when the order does not exist. */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const { rowCount } = await pool().query(`update public.orders set status = $2 where id = $1`, [id, status]);
  return rowCount === 1;
}
