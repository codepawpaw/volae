import "server-only";
import { Pool, types, type PoolClient } from "pg";
import { RETRYABLE_SHIPMENT_STATUSES } from "./couriers";
import type { Brand, Category, Database, Order, OrderStatus, PaymentStatus, Product, Settings, Subscriber } from "./types";

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
       weight, description, features, colors, sizes, activities, images, badge, is_new as "isNew", is_active as "isActive",
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

const ORDER_COLUMNS = `o.id, o.number,
       json_build_object('name', o.customer_name, 'phone', o.customer_phone, 'email', o.customer_email,
         'address', o.customer_address, 'note', o.customer_note) as customer,
       coalesce(
         (select json_agg(json_build_object('productId', i.product_id, 'name', i.name, 'brand', i.brand,
            'color', i.color, 'size', i.size, 'qty', i.qty, 'unitPrice', i.unit_price, 'weight', i.weight)
            order by i.position)
          from public.order_items i where i.order_id = o.id),
         '[]'
       ) as lines,
       o.subtotal, o.total, o.status,
       json_build_object('status', o.payment_status, 'type', o.payment_type, 'redirectUrl', o.payment_redirect_url,
         'expiresAt', o.payment_expires_at, 'paidAt', o.paid_at) as payment,
       json_build_object('areaId', o.shipping_area_id, 'areaName', o.shipping_area_name,
         'postalCode', o.shipping_postal_code, 'courierCode', o.shipping_courier_code,
         'serviceCode', o.shipping_service_code, 'courierName', o.shipping_courier_name,
         'serviceName', o.shipping_service_name, 'duration', o.shipping_duration, 'cost', o.shipping_cost,
         'weight', o.shipping_weight,
         'shipment', json_build_object('id', o.shipment_id, 'status', o.shipment_status,
           'trackingId', o.shipment_tracking_id, 'waybillId', o.shipment_waybill_id,
           'trackingUrl', o.shipment_tracking_url, 'price', o.shipment_price,
           'updatedAt', o.shipment_updated_at)) as shipping,
       o.created_at as "createdAt", o.updated_at as "updatedAt"`;

/** All orders with their lines, newest first. */
export async function listOrders(db: Queryable = pool()): Promise<Order[]> {
  const { rows } = await db.query<Order>(`select ${ORDER_COLUMNS} from public.orders o order by o.created_at desc`);
  return rows;
}

export async function getOrderByNumber(number: string, db: Queryable = pool()): Promise<Order | null> {
  const { rows } = await db.query<Order>(`select ${ORDER_COLUMNS} from public.orders o where o.number = $1`, [number]);
  return rows[0] ?? null;
}

export async function getOrderById(id: string, db: Queryable = pool()): Promise<Order | null> {
  const { rows } = await db.query<Order>(`select ${ORDER_COLUMNS} from public.orders o where o.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getOrderByShipmentId(shipmentId: string, db: Queryable = pool()): Promise<Order | null> {
  const { rows } = await db.query<Order>(`select ${ORDER_COLUMNS} from public.orders o where o.shipment_id = $1`, [
    shipmentId,
  ]);
  return rows[0] ?? null;
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
       colors, sizes, activities, images, badge, is_new, is_active, created_at, updated_at, weight)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     on conflict (id) do update set name = excluded.name, slug = excluded.slug, brand_id = excluded.brand_id,
       category_id = excluded.category_id, price = excluded.price, sale_price = excluded.sale_price,
       description = excluded.description, features = excluded.features, colors = excluded.colors,
       sizes = excluded.sizes, activities = excluded.activities, images = excluded.images, badge = excluded.badge,
       is_new = excluded.is_new, is_active = excluded.is_active, weight = excluded.weight`,
    [
      p.id, p.name, p.slug, p.brandId, p.categoryId, p.price, p.salePrice, p.description, p.features,
      // jsonb: pass as JSON text, otherwise pg would send a Postgres array.
      JSON.stringify(p.colors),
      p.sizes, p.activities, p.images, p.badge, p.isNew, p.isActive, p.createdAt, p.updatedAt, p.weight,
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
    `insert into public.orders (id, number, customer_name, customer_phone, customer_email, customer_address,
       customer_note, subtotal, total, status, payment_status, created_at, updated_at,
       shipping_area_id, shipping_area_name, shipping_postal_code, shipping_courier_code, shipping_service_code,
       shipping_courier_name, shipping_service_name, shipping_duration, shipping_cost, shipping_weight)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
    [o.id, o.number, o.customer.name, o.customer.phone, o.customer.email, o.customer.address, o.customer.note,
      o.subtotal, o.total, o.status, o.payment.status, o.createdAt, o.updatedAt,
      o.shipping.areaId, o.shipping.areaName, o.shipping.postalCode, o.shipping.courierCode, o.shipping.serviceCode,
      o.shipping.courierName, o.shipping.serviceName, o.shipping.duration, o.shipping.cost, o.shipping.weight],
  );
  for (const [position, l] of o.lines.entries()) {
    await tx.query(
      `insert into public.order_items (order_id, position, product_id, name, brand, color, size, qty, unit_price, weight)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [o.id, position, l.productId, l.name, l.brand, l.color, l.size, l.qty, l.unitPrice, l.weight],
    );
  }
}

/** Returns false when the order does not exist. */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const { rowCount } = await pool().query(`update public.orders set status = $2 where id = $1`, [id, status]);
  return rowCount === 1;
}

/** Stores the Snap payment page for an order that is waiting for payment. */
export async function setOrderPaymentLink(id: string, redirectUrl: string, expiresAt: string) {
  await pool().query(
    `update public.orders set payment_status = 'pending', payment_redirect_url = $2, payment_expires_at = $3,
       payment_updated_at = now()
     where id = $1 and payment_status = 'unpaid'`,
    [id, redirectUrl, expiresAt],
  );
}

/**
 * Records the latest Midtrans status of an order and moves the order along:
 * paid -> "paid" (from new/confirmed), expired/cancelled -> "cancelled" (only while still new).
 * Later order statuses (shipped, completed) are never touched.
 */
export async function applyPayment(
  number: string,
  p: { status: PaymentStatus; type: string | null; transactionId: string | null },
) {
  await pool().query(
    `update public.orders set
       payment_status = $2,
       payment_type = coalesce($3, payment_type),
       payment_transaction_id = coalesce($4, payment_transaction_id),
       payment_updated_at = now(),
       paid_at = case when $2 = 'paid' then coalesce(paid_at, now()) else paid_at end,
       status = case
         when $2 = 'paid' and status in ('new', 'confirmed') then 'paid'::public.order_status
         when $2 in ('expired', 'cancelled') and status = 'new' then 'cancelled'::public.order_status
         else status end
     where number = $1`,
    [number, p.status, p.type, p.transactionId],
  );
}

export async function logPaymentNotification(
  kind: "payment" | "recurring" | "account_linking",
  orderNumber: string | null,
  verified: boolean,
  payload: unknown,
) {
  await pool().query(
    `insert into public.payment_notifications (kind, order_number, verified, payload) values ($1, $2, $3, $4)`,
    [kind, orderNumber, verified, JSON.stringify(payload)],
  );
}

// ---------- Shipping (Biteship) ----------

/**
 * Gets an order ready for a new shipment and returns its attempt number (0 for the first), or
 * null when it already has an active shipment. A failed or cancelled shipment is cleared and the
 * attempt goes up, so the next Biteship reference id is new. Concurrent calls get the same
 * attempt, and Biteship rejects the duplicate reference id, so only one pickup is booked.
 */
export async function prepareShipment(id: string): Promise<number | null> {
  const { rows } = await pool().query<{ attempt: number }>(
    `update public.orders set
       shipment_attempt = case when shipment_id is null then shipment_attempt else shipment_attempt + 1 end,
       shipment_id = null, shipment_status = null, shipment_tracking_id = null, shipment_waybill_id = null,
       shipment_tracking_url = null, shipment_price = null
     where id = $1 and (shipment_id is null or shipment_status = any($2::text[]))
     returning shipment_attempt as attempt`,
    [id, RETRYABLE_SHIPMENT_STATUSES],
  );
  return rows[0]?.attempt ?? null;
}

export type ShipmentUpdate = {
  id: string;
  status: string | null;
  trackingId: string | null;
  waybillId: string | null;
  trackingUrl: string | null;
  price: number | null;
};

/**
 * Saves the latest Biteship state of an order's shipment and moves the order along:
 * picked up / on the way -> "shipped" (from new/confirmed/paid), delivered -> "completed".
 * Cancelled orders are never touched.
 */
export async function applyShipment(orderId: string, s: ShipmentUpdate) {
  await pool().query(
    `update public.orders set
       shipment_id = $2,
       shipment_status = coalesce($3, shipment_status),
       shipment_tracking_id = coalesce($4, shipment_tracking_id),
       shipment_waybill_id = coalesce($5, shipment_waybill_id),
       shipment_tracking_url = coalesce($6, shipment_tracking_url),
       shipment_price = coalesce($7, shipment_price),
       shipment_updated_at = now(),
       status = case
         when $3 in ('picked', 'in_transit', 'dropping_off', 'on_hold') and status in ('new', 'confirmed', 'paid')
           then 'shipped'::public.order_status
         when $3 = 'delivered' and status <> 'cancelled' then 'completed'::public.order_status
         else status end
     -- A late sync of a replaced shipment must not overwrite the new one.
     where id = $1 and (shipment_id is null or shipment_id = $2)`,
    [orderId, s.id, s.status, s.trackingId, s.waybillId, s.trackingUrl, s.price],
  );
}

export async function logShippingNotification(event: string | null, shipmentId: string | null, payload: unknown) {
  await pool().query(`insert into public.shipping_notifications (event, shipment_id, payload) values ($1, $2, $3)`, [
    event,
    shipmentId,
    JSON.stringify(payload),
  ]);
}
