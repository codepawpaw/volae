-- Shipping through Biteship: courier rates at checkout, shipments (pickup orders) from admin,
-- status updates by webhook. Docs: https://biteship.com/id/docs/intro

-- Product weight in grams, used for courier rates. Existing products get 500 g.
alter table public.products
  add column weight integer not null default 500 check (weight > 0 and weight <= 100000);

-- Snapshot of the unit weight at checkout, sent to Biteship with the shipment.
alter table public.order_items
  add column weight integer not null default 500 check (weight > 0);

alter table public.orders
  -- total = subtotal + shipping_cost. Older orders had free shipping, so subtotal = total.
  add column subtotal                bigint check (subtotal >= 0),
  -- Destination picked at checkout (Biteship Maps area).
  add column shipping_area_id        text,
  add column shipping_area_name      text not null default '',
  add column shipping_postal_code    text not null default '',
  -- Courier picked at checkout, e.g. jne / reg.
  add column shipping_courier_code   text,
  add column shipping_service_code   text,
  add column shipping_courier_name   text not null default '',
  add column shipping_service_name   text not null default '',
  add column shipping_duration       text not null default '',
  add column shipping_cost           bigint not null default 0 check (shipping_cost >= 0),
  add column shipping_weight         integer not null default 0 check (shipping_weight >= 0),
  -- Biteship order (the pickup request), created from admin once the order is paid.
  add column shipment_id             text unique,
  add column shipment_attempt        integer not null default 0 check (shipment_attempt >= 0),
  add column shipment_status         text,          -- Biteship status: confirmed, allocated, picked, delivered, ...
  add column shipment_tracking_id    text,
  add column shipment_waybill_id     text,          -- resi
  add column shipment_tracking_url   text,
  add column shipment_price          bigint,        -- what Biteship charges the store (can change after weighing)
  add column shipment_updated_at     timestamptz;

update public.orders set subtotal = total where subtotal is null;
alter table public.orders alter column subtotal set not null, alter column subtotal set default 0;

create index orders_shipment_status_idx on public.orders (shipment_status);

-- Every Biteship webhook call, kept for auditing and debugging.
create table public.shipping_notifications (
  id           bigint generated always as identity primary key,
  event        text,
  shipment_id  text,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

create index shipping_notifications_shipment_idx on public.shipping_notifications (shipment_id, received_at desc);

alter table public.shipping_notifications enable row level security;
