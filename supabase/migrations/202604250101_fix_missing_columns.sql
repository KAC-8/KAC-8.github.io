create extension if not exists pgcrypto;

alter table if exists public.profile_info
  add column if not exists full_name text,
  add column if not exists title text,
  add column if not exists status text,
  add column if not exists experience_level text;

alter table if exists public.profile_info
  drop column if exists bio;

alter table if exists public.projects
  add column if not exists tags text[] not null default '{}',
  add column if not exists thumbnail_url text,
  add column if not exists status text not null default 'in_progress',
  add column if not exists featured boolean not null default false;

update public.projects
set status = 'completed'
where lower(coalesce(status, '')) in ('completed', 'live');

update public.projects
set status = 'in_progress'
where lower(coalesce(status, '')) not in ('completed', 'in_progress', 'soon');

alter table if exists public.projects drop constraint if exists projects_status_check;
alter table if exists public.projects
  add constraint projects_status_check check (status in ('completed', 'in_progress', 'soon'));

alter table if exists public.certificates
  add column if not exists local_path text,
  add column if not exists is_specialization boolean not null default false,
  add column if not exists sort_order integer not null default 100;

update public.certificates
set sort_order = 100
where sort_order is null;

create table if not exists public.certificate_specialization_courses (
  id uuid primary key default gen_random_uuid(),
  specialization_id uuid not null references public.certificates(id) on delete cascade,
  course_certificate_id uuid not null references public.certificates(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint certificate_specialization_unique unique (specialization_id, course_certificate_id),
  constraint certificate_specialization_not_self check (specialization_id <> course_certificate_id)
);

create index if not exists idx_certificate_specialization_parent
  on public.certificate_specialization_courses(specialization_id);
create index if not exists idx_certificate_specialization_child
  on public.certificate_specialization_courses(course_certificate_id);
create index if not exists idx_certificates_sort_order
  on public.certificates(sort_order);

alter table public.certificate_specialization_courses enable row level security;

drop policy if exists "Certificate owner can read specialization links" on public.certificate_specialization_courses;
create policy "Certificate owner can read specialization links"
on public.certificate_specialization_courses for select
using (
  exists (
    select 1
    from public.certificates c
    where c.id = specialization_id
      and (c.is_public = true or auth.uid() = c.user_id)
  )
);

drop policy if exists "Certificate owner can write specialization links" on public.certificate_specialization_courses;
create policy "Certificate owner can write specialization links"
on public.certificate_specialization_courses for all
using (
  exists (
    select 1
    from public.certificates c
    where c.id = specialization_id
      and auth.uid() = c.user_id
  )
)
with check (
  exists (
    select 1
    from public.certificates c
    where c.id = specialization_id
      and auth.uid() = c.user_id
  )
);
