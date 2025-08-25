create table public.users (
  id uuid not null default gen_random_uuid (),
  auth_user_id uuid not null,
  email text null,
  roblox_user_id bigint null,
  roblox_username text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  avatar_url text null,
  is_admin boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists users_roblox_user_id_idx on public.users using btree (roblox_user_id) TABLESPACE pg_default;

create unique INDEX IF not exists users_auth_user_id_unique on public.users using btree (auth_user_id) TABLESPACE pg_default
where
  (auth_user_id is not null);

create unique INDEX IF not exists users_email_unique on public.users using btree (email) TABLESPACE pg_default
where
  (email is not null);

create unique INDEX IF not exists users_auth_user_id_uidx on public.users using btree (auth_user_id) TABLESPACE pg_default;

create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  amount_brl integer not null,
  robux_liquid integer not null,
  route text null default 'PIX'::text,
  payment_status text null default 'pending'::text,
  provider text null default 'abacatepay'::text,
  provider_payment_id text null,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  gamepass_id bigint null,
  product_id bigint null,
  seller_user_id bigint null,
  buyer_user_id bigint null,
  expected_price integer null,
  purchase_id text null,
  purchase_status text null default 'pending'::text,
  purchase_error text null,
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint orders_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'paid'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  ),
  constraint orders_purchase_status_check check (
    (
      purchase_status = any (
        array[
          'pending'::text,
          'purchased'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint orders_route_check check (
    (
      route = any (array['PIX'::text, 'GAMEPASS'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists orders_user_status_idx on public.orders using btree (user_id, payment_status) TABLESPACE pg_default;

create index IF not exists orders_gamepass_id_idx on public.orders using btree (gamepass_id) TABLESPACE pg_default;

create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  amount_brl integer not null,
  robux_liquid integer not null,
  route text null default 'PIX'::text,
  payment_status text null default 'pending'::text,
  provider text null default 'abacatepay'::text,
  provider_payment_id text null,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  gamepass_id bigint null,
  product_id bigint null,
  seller_user_id bigint null,
  buyer_user_id bigint null,
  expected_price integer null,
  purchase_id text null,
  purchase_status text null default 'pending'::text,
  purchase_error text null,
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint orders_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'paid'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  ),
  constraint orders_purchase_status_check check (
    (
      purchase_status = any (
        array[
          'pending'::text,
          'purchased'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint orders_route_check check (
    (
      route = any (array['PIX'::text, 'GAMEPASS'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists orders_user_status_idx on public.orders using btree (user_id, payment_status) TABLESPACE pg_default;

create index IF not exists orders_gamepass_id_idx on public.orders using btree (gamepass_id) TABLESPACE pg_default;

create table public.settings (
  id integer not null,
  c_bruto numeric(10, 5) not null default 0.11,
  price_per_robux numeric(10, 5) not null default 0.20,
  constraint settings_pkey primary key (id),
  constraint settings_id_check check ((id = 1))
) TABLESPACE pg_default;

-- RLS enable
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

create policy if not exists users_self_read on public.users for select using (auth.uid() = auth_user_id or auth_user_id is null);
create policy if not exists orders_self_read on public.orders for select using (user_id in (select id from public.users where auth_user_id = auth.uid()));