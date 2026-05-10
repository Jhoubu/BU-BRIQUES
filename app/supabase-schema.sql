-- ============================================================
-- BU-BRIQUES — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- PRODUTOS
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  custo_base numeric(12,2) not null default 0,
  foto_url text,
  status text not null default 'disponivel' check (status in ('disponivel', 'vendido')),
  criado_em timestamptz not null default now()
);

-- GASTOS POR PRODUTO
create table if not exists gastos_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  criado_em timestamptz not null default now()
);

-- VENDAS
create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  valor_venda numeric(12,2) not null default 0,
  data_venda date not null default current_date,
  forma_pagamento text not null default 'a_vista'
    check (forma_pagamento in ('a_vista', 'fiado', 'dinheiro_mais_item')),
  observacoes text,
  criado_em timestamptz not null default now()
);

-- META DO MÊS
create table if not exists meta_mes (
  id uuid primary key default gen_random_uuid(),
  mes text not null unique,  -- format: YYYY-MM
  valor_meta numeric(12,2) not null default 0
);

-- ============================================================
-- Storage bucket for product photos (run once)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict do nothing;

-- Storage RLS policies
create policy "Public read produtos"
  on storage.objects for select
  using (bucket_id = 'produtos');

create policy "Anon upload produtos"
  on storage.objects for insert
  with check (bucket_id = 'produtos');

create policy "Anon update produtos"
  on storage.objects for update
  using (bucket_id = 'produtos');

create policy "Anon delete produtos"
  on storage.objects for delete
  using (bucket_id = 'produtos');

-- ============================================================
-- Migration: add data_compra and preco_estimado_venda to produtos
-- Run this if the table already exists
-- ============================================================
alter table produtos add column if not exists data_compra date;
alter table produtos add column if not exists preco_estimado_venda numeric(12,2);

-- ============================================================
-- RLS: Disable for personal use (or configure per your needs)
-- ============================================================
alter table produtos enable row level security;
alter table gastos_produto enable row level security;
alter table vendas enable row level security;
alter table meta_mes enable row level security;

-- Allow all for authenticated (personal app — single user)
create policy "Allow all for authenticated" on produtos for all using (true);
create policy "Allow all for authenticated" on gastos_produto for all using (true);
create policy "Allow all for authenticated" on vendas for all using (true);
create policy "Allow all for authenticated" on meta_mes for all using (true);
