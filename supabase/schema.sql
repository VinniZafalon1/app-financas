-- Execute no SQL Editor do Supabase antes de usar o modo conectado.
create extension if not exists pgcrypto;

create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (char_length(descricao) between 1 and 80),
  valor numeric(12,2) not null check (valor > 0),
  categoria text not null,
  data date not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (char_length(descricao) between 1 and 80),
  valor numeric(12,2) not null check (valor > 0),
  categoria text not null,
  data date not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.receitas enable row level security;
alter table public.despesas enable row level security;

create policy "Usuários gerenciam suas receitas" on public.receitas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuários gerenciam suas despesas" on public.despesas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists receitas_user_data_idx on public.receitas (user_id, data desc);
create index if not exists despesas_user_data_idx on public.despesas (user_id, data desc);