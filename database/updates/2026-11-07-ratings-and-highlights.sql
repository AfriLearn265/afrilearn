-- =====================================================================
-- AfriLearn: real star ratings for lessons, and real numbers for the homepage.
-- Nothing here is invented: every number comes from what pupils and parents actually do.
-- Run after 2026-11-06-curriculum-topics.sql.
-- =====================================================================

create table if not exists public.topic_ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.curriculum_topics(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
create index if not exists topic_ratings_topic on public.topic_ratings (topic_id);
alter table public.topic_ratings enable row level security;
revoke all on public.topic_ratings from anon, authenticated;
grant select, insert, update on public.topic_ratings to authenticated;
create policy "topic_ratings: own" on public.topic_ratings for select to authenticated using (user_id = (select auth.uid()));
create policy "topic_ratings: add own" on public.topic_ratings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "topic_ratings: change own" on public.topic_ratings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The most-used lessons, with their real average rating, video views and quiz plays.
create or replace function public.public_topic_highlights(p_limit int default 6)
returns table (code text, title text, class_name text, class_code text, subject_code text, stars numeric, ratings int, views int, plays int)
language sql stable security definer set search_path = '' as $$
  with t as (
    select ct.id, ct.code, ct.title, c.name as class_name, c.code as class_code, s.code as subject_code,
      (select round(avg(r.stars)::numeric, 1) from public.topic_ratings r where r.topic_id = ct.id) as stars,
      (select count(*)::int from public.topic_ratings r where r.topic_id = ct.id) as ratings,
      (select coalesce(sum(v.view_count), 0)::int from public.class_videos v where v.topic_id = ct.id and v.is_published) as views,
      (select count(*)::int from public.topic_progress p where p.topic_id = ct.id and p.quiz_total is not null) as plays,
      exists (select 1 from public.class_videos v where v.topic_id = ct.id and v.is_published) as has_video,
      ct.notes is not null as has_notes
    from public.curriculum_topics ct
    join public.classes c on c.id = ct.class_id
    join public.subjects s on s.id = ct.subject_id
    where ct.is_published and s.code in ('english', 'mathematics')
  )
  select code, title, class_name, class_code, subject_code, stars, ratings, views, plays
  from t where has_video or has_notes
  order by (views + plays * 3 + ratings * 5) desc, has_video desc, class_code, title
  limit greatest(1, least(p_limit, 12))
$$;
revoke all on function public.public_topic_highlights(int) from public;
grant execute on function public.public_topic_highlights(int) to anon, authenticated;

-- Totals for the homepage counters.
create or replace function public.public_platform_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'topics', (select count(*) from public.curriculum_topics where is_published),
    'video_views', (select coalesce(sum(view_count), 0) from public.class_videos where is_published),
    'quiz_plays', (select count(*) from public.topic_progress where quiz_total is not null) + (select count(*) from public.exam_attempts),
    'rating', (select round(avg(stars)::numeric, 1) from public.topic_ratings),
    'ratings', (select count(*) from public.topic_ratings)
  )
$$;
revoke all on function public.public_platform_stats() from public;
grant execute on function public.public_platform_stats() to anon, authenticated;
