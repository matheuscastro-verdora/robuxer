-- Correção final do schema de usuários para funcionar com o trigger

-- 1) Remover NOT NULL de roblox_user_id (se ainda existir)
alter table public.users
  alter column roblox_user_id drop not null;

-- 2) Garantir que roblox_username não seja NOT NULL
alter table public.users
  alter column roblox_username drop not null;

-- 3) Ajustar trigger para inserir corretamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, roblox_username, roblox_user_id, joined_at)
  values (new.id, lower(new.email), null, null, now())
  on conflict (auth_user_id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- 4) Recriar trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5) Adicionar policy de INSERT para o trigger funcionar
drop policy if exists users_insert_trigger on public.users;
create policy users_insert_trigger on public.users
  for insert with check (true);

-- 6) Garantir que o trigger pode inserir (bypass RLS para função security definer)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.users to postgres, anon, authenticated, service_role;
