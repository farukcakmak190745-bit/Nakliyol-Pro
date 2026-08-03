-- =============================================
-- NakliYol — Web Push abonelik tablosu
-- Bu dosyayı Supabase SQL Editor'de çalıştırın.
-- =============================================

create table if not exists public.push_abonelikleri (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  tarayici text,
  olusturulma_zamani timestamptz default now(),
  unique (user_id, endpoint)
);

alter table public.push_abonelikleri enable row level security;

-- Kullanıcı kendi aboneliklerini görebilir
drop policy if exists "push_kendi_gor" on public.push_abonelikleri;
create policy "push_kendi_gor" on public.push_abonelikleri
  for select using (auth.uid() = user_id);

-- Kullanıcı kendi aboneliğini ekleyebilir
drop policy if exists "push_kendi_ekle" on public.push_abonelikleri;
create policy "push_kendi_ekle" on public.push_abonelikleri
  for insert with check (auth.uid() = user_id);

-- Kullanıcı kendi aboneliğini silebilir
drop policy if exists "push_kendi_sil" on public.push_abonelikleri;
create policy "push_kendi_sil" on public.push_abonelikleri
  for delete using (auth.uid() = user_id);

-- Kullanıcı kendi aboneliğini güncelleyebilir (upsert için)
drop policy if exists "push_kendi_guncelle" on public.push_abonelikleri;
create policy "push_kendi_guncelle" on public.push_abonelikleri
  for update using (auth.uid() = user_id);

-- Vercel serverless fonksiyon anon anahtarla okuyabilmeli (sunucu tarafı)
drop policy if exists "push_anon_oku" on public.push_abonelikleri;
create policy "push_anon_oku" on public.push_abonelikleri
  for select using (true);
