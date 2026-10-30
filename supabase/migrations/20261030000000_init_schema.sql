-- Initial schema for the volae storefront. Mirrors the collections in src/lib/types.ts.
-- IDs stay text (e.g. "b_volae", "p_001", "o_<uuid>") so existing data and URLs keep working.
-- Money is stored in whole rupiah (bigint).

-- Shared trigger: keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Brands ---------------------------------------------------------------------

create table public.brands (
  id          text primary key,
  name        text not null check (length(trim(name)) > 0),
  slug        text not null unique,
  description text not null default '',
  logo        text,
  image       text,
  sort_order  integer not null default 0 check (sort_order >= 0),
  created_at  timestamptz not null default now()
);

create index brands_sort_order_idx on public.brands (sort_order);

-- Categories (two-level tree: parent_id is null for top-level) --------------

create table public.categories (
  id          text primary key,
  name        text not null check (length(trim(name)) > 0),
  slug        text not null unique,
  parent_id   text references public.categories (id) on delete restrict,
  description text not null default '',
  image       text,
  sort_order  integer not null default 0 check (sort_order >= 0),
  created_at  timestamptz not null default now(),
  check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id, sort_order);

-- Products -------------------------------------------------------------------

create table public.products (
  id          text primary key,
  name        text not null check (length(trim(name)) > 0),
  slug        text not null unique,
  brand_id    text not null references public.brands (id) on delete restrict,
  category_id text not null references public.categories (id) on delete restrict,
  price       bigint not null check (price > 0),
  sale_price  bigint check (sale_price > 0),
  description text not null default '',
  features    text[] not null default '{}',
  -- [{ "name": "Black", "hex": "#1c1c1c", "image": "/..." | null }], in display order
  colors      jsonb not null default '[]' check (jsonb_typeof(colors) = 'array'),
  sizes       text[] not null default '{}',
  activities  text[] not null default '{}',
  images      text[] not null default '{}',
  badge       text,
  is_new      boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_brand_id_idx on public.products (brand_id);
create index products_category_id_idx on public.products (category_id);
create index products_active_created_idx on public.products (created_at desc) where is_active;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Newsletter subscribers -----------------------------------------------------

create table public.subscribers (
  email      text primary key check (email = lower(email) and position('@' in email) > 1),
  created_at timestamptz not null default now()
);

-- Orders ---------------------------------------------------------------------

create type public.order_status as enum ('new', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled');

create table public.orders (
  id               text primary key,
  number           text not null unique, -- e.g. VL261030001
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text not null,
  customer_note    text not null default '',
  total            bigint not null check (total >= 0),
  status           public.order_status not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Order lines are a snapshot taken at checkout, so name/brand/price survive later
-- catalogue edits; product_id is kept only as a link and cleared if the product is deleted.
create table public.order_items (
  id         bigint generated always as identity primary key,
  order_id   text not null references public.orders (id) on delete cascade,
  position   integer not null check (position >= 0),
  product_id text references public.products (id) on delete set null,
  name       text not null,
  brand      text not null default '',
  color      text not null default '',
  size       text not null default '',
  qty        integer not null check (qty > 0),
  unit_price bigint not null check (unit_price >= 0),
  unique (order_id, position)
);

create index order_items_product_id_idx on public.order_items (product_id);

-- Site settings (key/value; e.g. key 'homeFeatured') -------------------------

create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
-- The publishable (anon) key is public, so RLS is on everywhere. Anonymous clients may
-- only read the public catalogue; all writes and order/subscriber data go through the
-- server (service role / direct connection), which bypasses RLS.

alter table public.brands      enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.subscribers enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.settings    enable row level security;

create policy "Public can read brands" on public.brands
  for select to anon, authenticated using (true);

create policy "Public can read categories" on public.categories
  for select to anon, authenticated using (true);

create policy "Public can read active products" on public.products
  for select to anon, authenticated using (is_active);

create policy "Public can read settings" on public.settings
  for select to anon, authenticated using (true);
