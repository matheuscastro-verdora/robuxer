-- users
create table if not exists public.users (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid references auth.users(id) on delete set null,
	email text,
	roblox_user_id bigint,
	roblox_username text not null,
	joined_at timestamptz,
	eligible_at timestamptz,
	is_eligible boolean default false,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- orders
create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.users(id) on delete cascade,
	amount_brl integer not null,
	robux_liquid integer not null,
	route text check (route in ('PIX')) default 'PIX',
	payment_status text check (payment_status in ('pending','paid','failed','refunded')) default 'pending',
	provider text default 'abacatepay',
	provider_payment_id text,
	paid_at timestamptz,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- payouts
create table if not exists public.payouts (
	id uuid primary key default gen_random_uuid(),
	order_id uuid references public.orders(id) on delete cascade,
	user_id uuid references public.users(id) on delete cascade,
	amount_robux integer not null,
	status text check (status in ('queued','sent','ok','error','retry')) default 'queued',
	roblox_tx_id text,
	attempts int default 0,
	last_error text,
	scheduled_at timestamptz default now(),
	sent_at timestamptz,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- event_logs
create table if not exists public.event_logs (
	id text primary key,
	type text,
	created_at timestamptz default now()
);

-- settings
create table if not exists public.settings (
	id int primary key check (id = 1),
	c_bruto numeric(10,5) not null default 0.11,
	price_per_robux numeric(10,5) not null default 0.20
);
insert into public.settings (id) values (1) on conflict do nothing;

-- indexes
create index if not exists users_roblox_user_id_idx on public.users (roblox_user_id);
create index if not exists users_is_eligible_idx on public.users (is_eligible);
create index if not exists orders_user_status_idx on public.orders (user_id, payment_status);
create index if not exists payouts_status_sched_idx on public.payouts (status, scheduled_at);

-- RLS enable
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.payouts enable row level security;
alter table public.event_logs enable row level security;
alter table public.settings enable row level security;

-- policies (example) - create only if they don't exist
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_self_read'
  ) then
    create policy users_self_read on public.users for select using (auth.uid() = auth_user_id or auth_user_id is null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_self_read'
  ) then
    create policy orders_self_read on public.orders for select using (user_id in (select id from public.users where auth_user_id = auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payouts' and policyname = 'payouts_self_read'
  ) then
    create policy payouts_self_read on public.payouts for select using (user_id in (select id from public.users where auth_user_id = auth.uid()));
  end if;
end $$;
