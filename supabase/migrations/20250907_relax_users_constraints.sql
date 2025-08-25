-- Tornar roblox_username opcional para não quebrar o trigger de criação de usuário
-- O trigger insere em public.users antes do vínculo do Roblox, então o NOT NULL gera 500 no signup

alter table public.users
  alter column roblox_username drop not null;


