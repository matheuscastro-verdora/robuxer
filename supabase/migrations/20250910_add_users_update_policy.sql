-- Adicionar política de UPDATE para usuários poderem atualizar seus próprios perfis
-- Primeiro remover a política se ela existir
drop policy if exists users_self_update on public.users;

-- Criar a nova política
create policy users_self_update on public.users 
  for update using (auth.uid() = auth_user_id);

-- Verificar se a política foi criada
select schemaname, tablename, policyname, permissive, roles, cmd, qual 
from pg_policies 
where tablename = 'users' and policyname = 'users_self_update';
