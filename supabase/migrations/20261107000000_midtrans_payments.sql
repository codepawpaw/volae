-- Online payment through Midtrans Snap.
-- The Midtrans order_id is the order number (e.g. VL261107001).

alter table public.orders
  add column customer_email          text not null default '',
  -- unpaid: Snap not started · pending: waiting for the buyer (e.g. bank transfer) · paid
  -- failed: denied / failed attempt · expired / cancelled: transaction closed · refunded
  add column payment_status          text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  add column payment_type            text,          -- e.g. bank_transfer, gopay, qris, credit_card
  add column payment_transaction_id  text,          -- Midtrans transaction_id
  add column payment_redirect_url    text,          -- Snap payment page, valid until payment_expires_at
  add column payment_expires_at      timestamptz,
  add column payment_updated_at      timestamptz,
  add column paid_at                 timestamptz;

create index orders_payment_status_idx on public.orders (payment_status);

-- Every HTTP notification Midtrans sends, kept for auditing and debugging.
create table public.payment_notifications (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('payment', 'recurring', 'account_linking')),
  order_number text,
  verified     boolean not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

create index payment_notifications_order_idx on public.payment_notifications (order_number, received_at desc);

alter table public.payment_notifications enable row level security;
