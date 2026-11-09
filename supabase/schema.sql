-- Brain-Scan DSA — Supabase schema (Free tier, Postgres)
-- Run this in Supabase Dashboard > SQL Editor. RLS is on; for V1 demo, policies allow anon insert/select on own rows.
-- If you do not set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, the app uses localStorage only and never calls this.

create table if not exists profiles (
  id text primary key,
  target text,
  learning_style text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists brain_scan_results (
  id text primary key,
  profile jsonb not null default '{}'::jsonb,
  brain_type text,
  starting_level int default 3,
  target text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists attempts (
  id bigint generated always as identity primary key,
  question_id text not null,
  bucket text,
  correct boolean,
  time_ms int,
  created_at timestamptz default now()
);
create table if not exists roadmaps (
  id text primary key,
  stage text not null default 'foundation',
  chunk_ids jsonb not null default '[]'::jsonb,
  pace text default 'steady',
  updated_at timestamptz default now()
);
create table if not exists lessons_progress (
  id bigint generated always as identity primary key,
  chunk_id text not null,
  topic text,
  mastery int default 0,
  completed boolean default false,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table brain_scan_results enable row level security;
alter table attempts enable row level security;
alter table roadmaps enable row level security;
alter table lessons_progress enable row level security;

-- V1 demo policies (open for anon). Tighten with auth.uid() when you add real Auth.
create policy "anon read profiles" on profiles for select using (true);
create policy "anon write profiles" on profiles for insert with check (true);
create policy "anon read scan" on brain_scan_results for select using (true);
create policy "anon write scan" on brain_scan_results for insert with check (true);
create policy "anon update scan" on brain_scan_results for update using (true);
create policy "anon read attempts" on attempts for select using (true);
create policy "anon write attempts" on attempts for insert with check (true);
create policy "anon read roadmaps" on roadmaps for select using (true);
create policy "anon write roadmaps" on roadmaps for insert with check (true);
create policy "anon read progress" on lessons_progress for select using (true);
create policy "anon write progress" on lessons_progress for insert with check (true);
