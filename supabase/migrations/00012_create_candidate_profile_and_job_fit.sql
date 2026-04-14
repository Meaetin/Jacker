create table candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  cv_markdown text,
  cv_filename text,
  cv_mime_type text,
  cv_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_fit_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_description text not null,
  score integer not null check (score >= 0 and score <= 100),
  band text not null check (band in ('strong_fit', 'moderate_fit', 'weak_fit')),
  strengths_md text not null,
  gaps_md text not null,
  recommendations_md text not null,
  overall_feedback_md text not null,
  created_at timestamptz not null default now()
);

create index idx_candidate_profiles_user_id on candidate_profiles(user_id);
create index idx_job_fit_analyses_user_created_at on job_fit_analyses(user_id, created_at desc);

alter table candidate_profiles enable row level security;
alter table job_fit_analyses enable row level security;

create policy "Users can read own candidate profile" on candidate_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own candidate profile" on candidate_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own candidate profile" on candidate_profiles
  for update using (auth.uid() = user_id);

create policy "Users can read own job fit analyses" on job_fit_analyses
  for select using (auth.uid() = user_id);

create policy "Users can insert own job fit analyses" on job_fit_analyses
  for insert with check (auth.uid() = user_id);
