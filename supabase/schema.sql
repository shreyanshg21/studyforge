-- Run this whole file once in Supabase -> SQL Editor.
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, subject text, level text, content text,
  deleted boolean default false, deleted_at timestamptz, created_at timestamptz default now());

create table if not exists pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, subject text, level text, description text,
  file_url text not null, file_path text, file_name text,
  deleted boolean default false, deleted_at timestamptz, created_at timestamptz default now());

create table if not exists saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null, title text not null, subject text, level text, content text, url text,
  created_at timestamptz default now());

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  deck text not null, front text not null, back text not null, front_image text,
  deleted boolean default false, deleted_at timestamptz, created_at timestamptz default now());

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, subject text, kind text, due date, done boolean default false,
  created_at timestamptz default now());

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, date date not null, created_at timestamptz default now());

-- Private tables: each user sees only their own rows
do $$ declare t text; begin
  foreach t in array array['notes','saved','flashcards','tasks','exams'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format('create policy "own rows" on %I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Community PDFs: signed-in users can read live ones; only the owner can change them
alter table pdfs enable row level security;
drop policy if exists "read live or own" on pdfs;
drop policy if exists "insert own" on pdfs;
drop policy if exists "update own" on pdfs;
drop policy if exists "delete own" on pdfs;
create policy "read live or own" on pdfs for select to authenticated using (deleted = false or auth.uid() = user_id);
create policy "insert own" on pdfs for insert to authenticated with check (auth.uid() = user_id);
create policy "update own" on pdfs for update to authenticated using (auth.uid() = user_id);
create policy "delete own" on pdfs for delete to authenticated using (auth.uid() = user_id);

-- Storage bucket for uploaded PDFs
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', true) on conflict (id) do nothing;
drop policy if exists "pdf public read" on storage.objects;
drop policy if exists "pdf upload own folder" on storage.objects;
drop policy if exists "pdf delete own" on storage.objects;
create policy "pdf public read" on storage.objects for select using (bucket_id = 'pdfs');
create policy "pdf upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdf delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);