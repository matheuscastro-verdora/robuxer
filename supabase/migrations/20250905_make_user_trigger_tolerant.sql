-- Tornar o trigger de sincronização resiliente: nunca falhar o signup

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.users (auth_user_id, email, joined_at)
    values (new.id, lower(new.email), now())
    on conflict (auth_user_id) do update set
      email = excluded.email,
      updated_at = now();
  exception when others then
    -- não propagar erros para não quebrar o signup
    null;
  end;
  return new;
end;
$$;

-- garantir que o trigger aponte para a função atualizada
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


