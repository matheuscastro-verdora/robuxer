alter table public.users add column if not exists is_admin boolean default false;

-- Função para definir/retirar admin. Permite bootstrap quando não há admin ainda.
create or replace function public.set_admin(p_user_id uuid, p_value boolean)
returns void
language plpgsql
security definer
as $$
begin
  -- Apenas usuários autenticados podem chamar
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Se já existe pelo menos um admin, somente um admin pode alterar
  if exists(select 1 from public.users where is_admin = true) then
    if not exists(select 1 from public.users where auth_user_id = auth.uid() and is_admin = true) then
      raise exception 'not allowed';
    end if;
  end if;

  update public.users set is_admin = coalesce(p_value, false) where id = p_user_id;
end;
$$;


