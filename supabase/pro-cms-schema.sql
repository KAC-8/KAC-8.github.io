-- Professional Pro CMS schema for kac8.me
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profile_info (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  title text,
  status text,
  experience_level text,
  age integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  category text,
  proficiency integer not null default 50,
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_proficiency_range check (proficiency between 0 and 100)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  project_url text,
  repo_url text,
  thumbnail_url text,
  status text not null default 'in_progress',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_status_check check (status in ('completed', 'in_progress', 'soon'))
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  organization text not null,
  issued_at date not null,
  sort_order integer not null default 100,
  link text,
  local_path text,
  is_public boolean not null default true,
  is_specialization boolean not null default false,
  sub_courses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  url text not null,
  icon text,
  is_visible boolean not null default true,
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificate_specialization_courses (
  id uuid primary key default gen_random_uuid(),
  specialization_id uuid not null references public.certificates(id) on delete cascade,
  course_certificate_id uuid not null references public.certificates(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint certificate_specialization_unique unique (specialization_id, course_certificate_id),
  constraint certificate_specialization_not_self check (specialization_id <> course_certificate_id)
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  maintenance_mode boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  action_status text not null default 'success',
  ip_address text,
  details text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint security_logs_status_check check (action_status in ('success', 'failed'))
);

create index if not exists idx_profile_info_user_id on public.profile_info(user_id);
create index if not exists idx_skills_user_id on public.skills(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_certificates_user_id on public.certificates(user_id);
create index if not exists idx_certificates_sort_order on public.certificates(sort_order);
create index if not exists idx_social_links_user_id on public.social_links(user_id);
create index if not exists idx_certificate_specialization_parent on public.certificate_specialization_courses(specialization_id);
create index if not exists idx_certificate_specialization_child on public.certificate_specialization_courses(course_certificate_id);
create index if not exists idx_security_logs_created_at on public.security_logs(created_at desc);
create index if not exists idx_security_logs_action_type on public.security_logs(action_type);

drop trigger if exists trg_profile_info_updated_at on public.profile_info;
create trigger trg_profile_info_updated_at
before update on public.profile_info
for each row execute function public.set_updated_at();

drop trigger if exists trg_skills_updated_at on public.skills;
create trigger trg_skills_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_certificates_updated_at on public.certificates;
create trigger trg_certificates_updated_at
before update on public.certificates
for each row execute function public.set_updated_at();

drop trigger if exists trg_social_links_updated_at on public.social_links;
create trigger trg_social_links_updated_at
before update on public.social_links
for each row execute function public.set_updated_at();

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

alter table public.profile_info enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.certificates enable row level security;
alter table public.social_links enable row level security;
alter table public.certificate_specialization_courses enable row level security;
alter table public.system_settings enable row level security;
alter table public.security_logs enable row level security;

drop policy if exists "Public can read profile info" on public.profile_info;
create policy "Public can read profile info"
on public.profile_info for select
using (true);

drop policy if exists "Owner can write profile info" on public.profile_info;
create policy "Owner can write profile info"
on public.profile_info for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
on public.skills for select
using (true);

drop policy if exists "Owner can write skills" on public.skills;
create policy "Owner can write skills"
on public.skills for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
on public.projects for select
using (true);

drop policy if exists "Owner can write projects" on public.projects;
create policy "Owner can write projects"
on public.projects for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Public can read certificates" on public.certificates;
create policy "Public can read certificates"
on public.certificates for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "Owner can write certificates" on public.certificates;
create policy "Owner can write certificates"
on public.certificates for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Certificate owner can read specialization links" on public.certificate_specialization_courses;
create policy "Certificate owner can read specialization links"
on public.certificate_specialization_courses for select
using (
  exists (
    select 1 from public.certificates c
    where c.id = specialization_id
      and (c.is_public = true or auth.uid() = c.user_id)
  )
);

drop policy if exists "Certificate owner can write specialization links" on public.certificate_specialization_courses;
create policy "Certificate owner can write specialization links"
on public.certificate_specialization_courses for all
using (
  exists (
    select 1 from public.certificates c
    where c.id = specialization_id
      and auth.uid() = c.user_id
  )
)
with check (
  exists (
    select 1 from public.certificates c
    where c.id = specialization_id
      and auth.uid() = c.user_id
  )
);

drop policy if exists "Public can read social links" on public.social_links;
create policy "Public can read social links"
on public.social_links for select
using (is_visible = true or auth.uid() = user_id);

drop policy if exists "Owner can write social links" on public.social_links;
create policy "Owner can write social links"
on public.social_links for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Public can read system settings" on public.system_settings;
create policy "Public can read system settings"
on public.system_settings for select
using (true);

drop policy if exists "Authenticated can write system settings" on public.system_settings;
create policy "Authenticated can write system settings"
on public.system_settings for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Allow insert security logs" on public.security_logs;
create policy "Allow insert security logs"
on public.security_logs for insert
with check (true);

drop policy if exists "Authenticated can read security logs" on public.security_logs;
create policy "Authenticated can read security logs"
on public.security_logs for select
using (auth.uid() is not null);
