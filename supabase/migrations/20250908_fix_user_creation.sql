-- Corrigir criação de usuários: remover NOT NULL de roblox_username e ajustar trigger

-- 1) Remover NOT NULL de roblox_username (se ainda existir)
alter table public.users
  alter column roblox_username drop not null;

-- 2) Ajustar trigger para inserir com roblox_username como NULL
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, roblox_username, joined_at)
  values (new.id, lower(new.email), null, now())
  on conflict (auth_user_id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- 3) Garantir que o trigger está ativo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
