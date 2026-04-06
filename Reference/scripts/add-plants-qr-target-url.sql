-- Run once in Supabase SQL Editor if your database was created before qr_target_url existed.
alter table public.plants add column if not exists qr_target_url text;
