-- Sincroniza novos usuários de auth.users para public.users (padrão de mercado Supabase)

-- 0) Normalizações básicas
update public.users set email = lower(email) where email is not null and email <> lower(email);

-- 1) Deduplicar por auth_user_id (mantém 1 linha arbitrária)
delete from public.users a
using public.users b
where a.ctid < b.ctid
  and a.auth_user_id is not null
  and a.auth_user_id = b.auth_user_id;

-- 2) Deduplicar por email (mantém 1 linha arbitrária)
delete from public.users a
using public.users b
where a.ctid < b.ctid
  and a.email is not null
  and a.email = b.email;

-- 3) Garantir unicidade (evita duplicatas futuras e permite ON CONFLICT)
create unique index if not exists users_auth_user_id_unique on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists users_email_unique on public.users (email) where email is not null;

-- 4) Backfill: inserir usuários de auth.users ausentes em public.users
insert into public.users (auth_user_id, email, joined_at)
select au.id, lower(au.email), now()
from auth.users au
left join public.users pu on pu.auth_user_id = au.id
where pu.id is null;

-- 5) Função de trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (auth_user_id, email, joined_at)
  values (new.id, lower(new.email), now())
  on conflict (auth_user_id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- 6) Trigger após insert em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


