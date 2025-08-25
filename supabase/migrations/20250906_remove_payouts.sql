-- Remover artefatos de payouts (não usados mais no fluxo Game Pass)

-- Apagar tabela e dependências
drop table if exists public.payouts cascade;

-- Opcional: remover índices e policies legadas caso persistam
do $$ begin
  begin execute 'drop index if exists payouts_status_sched_idx'; exception when others then null; end;
  begin execute 'drop policy if exists payouts_self_read on public.payouts'; exception when others then null; end;
  begin execute 'alter table public.payouts disable row level security'; exception when others then null; end;
exception when others then null; end $$;


