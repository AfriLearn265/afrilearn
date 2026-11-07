-- =====================================================================
-- AfriLearn: week-by-week scheme of work, a log of learning activity,
-- and the numbers behind the administrator's dashboard.
-- Run after 2026-11-07-ratings-and-highlights.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Scheme of work: which week(s) of the term each topic is taught.
--    Week 1 is resumption and revision, weeks 11 and 12 are revision and
--    examinations, so topics are spread across weeks 2 to 10 in curriculum
--    order. Schools can change any topic's weeks from Topics by term.
-- ---------------------------------------------------------------------
alter table public.curriculum_topics add column if not exists week_start smallint check (week_start between 1 and 14);
alter table public.curriculum_topics add column if not exists week_end smallint check (week_end between 1 and 14);
alter table public.curriculum_topics drop constraint if exists curriculum_topics_week_order;
alter table public.curriculum_topics add constraint curriculum_topics_week_order check (week_start is null or week_end is null or week_end >= week_start);
grant select (week_start, week_end) on public.curriculum_topics to anon;

with ranked as (
  select id,
    row_number() over (partition by class_id, subject_id, term order by sort_order) - 1 as i,
    count(*) over (partition by class_id, subject_id, term) as n
  from public.curriculum_topics
)
update public.curriculum_topics t
set week_start = 2 + floor(r.i * 9.0 / r.n)::int,
    week_end = greatest(2 + floor(r.i * 9.0 / r.n)::int, 1 + floor((r.i + 1) * 9.0 / r.n)::int)
from ranked r
where r.id = t.id and t.week_start is null;

-- ---------------------------------------------------------------------
-- 2. Learning activity log: one row each time a pupil plays a video,
--    takes a topic quiz or finishes a topic. Only administrators can read it.
-- ---------------------------------------------------------------------
create table if not exists public.learning_events (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('video', 'quiz', 'topic_done')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists learning_events_time on public.learning_events (created_at);
create index if not exists learning_events_student on public.learning_events (student_id, created_at);
alter table public.learning_events enable row level security;
revoke all on public.learning_events from anon, authenticated;
grant select on public.learning_events to authenticated;
create policy "learning_events: admins read" on public.learning_events for select to authenticated using ((select public.is_admin()));

create or replace function private.log_video_play()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.plays is distinct from old.plays then
    insert into public.learning_events (student_id, kind, ref_id) values (new.student_id, 'video', new.video_id);
  end if;
  return new;
end $$;
drop trigger if exists video_views_log on public.video_views;
create trigger video_views_log after insert or update of plays on public.video_views
  for each row execute function private.log_video_play();

-- Topic quizzes and "I've finished this topic" now leave a line in the log too.
create or replace function public.mark_topic_done(p_topic uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.students where profile_id = auth.uid()) then return; end if;
  insert into public.topic_progress (student_id, topic_id, completed_at)
  values (auth.uid(), p_topic, now())
  on conflict (student_id, topic_id) do update set completed_at = coalesce(public.topic_progress.completed_at, now()), updated_at = now();
  insert into public.learning_events (student_id, kind, ref_id) values (auth.uid(), 'topic_done', p_topic);
end $$;

create or replace function public.check_topic_quiz(p_topic uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_total int := 0; v_score int := 0; v_items jsonb := '[]'::jsonb; r record; v_pick int; v_pct int;
begin
  if auth.uid() is null then raise exception 'Log in to check your answers.'; end if;
  for r in select q.id, q.answer, q.explanation from public.topic_questions q where q.topic_id = p_topic order by q.sort_order, q.created_at loop
    v_total := v_total + 1;
    v_pick := nullif(p_answers ->> r.id::text, '')::int;
    if v_pick = r.answer then v_score := v_score + 1; end if;
    v_items := v_items || jsonb_build_object('id', r.id, 'correct', coalesce(v_pick = r.answer, false), 'answer', r.answer, 'explanation', r.explanation);
  end loop;
  if v_total = 0 then return jsonb_build_object('score', 0, 'total', 0, 'items', v_items); end if;
  v_pct := round(100.0 * v_score / v_total);
  if exists (select 1 from public.students where profile_id = auth.uid()) then
    insert into public.topic_progress (student_id, topic_id, quiz_score, quiz_total, best_percent, completed_at)
    values (auth.uid(), p_topic, v_score, v_total, v_pct, case when v_pct >= 50 then now() end)
    on conflict (student_id, topic_id) do update set
      quiz_score = excluded.quiz_score, quiz_total = excluded.quiz_total,
      best_percent = greatest(coalesce(public.topic_progress.best_percent, 0), excluded.best_percent),
      completed_at = coalesce(public.topic_progress.completed_at, excluded.completed_at), updated_at = now();
    insert into public.learning_events (student_id, kind, ref_id) values (auth.uid(), 'quiz', p_topic);
    if v_pct >= 50 then
      update public.students set points = points + v_score * 5 where profile_id = auth.uid();
    end if;
  end if;
  return jsonb_build_object('score', v_score, 'total', v_total, 'items', v_items);
end $$;

-- Carry over what already happened, so the charts don't start empty.
insert into public.learning_events (student_id, kind, ref_id, created_at)
select v.student_id, 'video', v.video_id, v.last_viewed_at from public.video_views v
where not exists (select 1 from public.learning_events e where e.kind = 'video' and e.student_id = v.student_id and e.ref_id = v.video_id);
insert into public.learning_events (student_id, kind, ref_id, created_at)
select p.student_id, 'quiz', p.topic_id, p.updated_at from public.topic_progress p
where p.quiz_total is not null and not exists (select 1 from public.learning_events e where e.kind = 'quiz' and e.student_id = p.student_id and e.ref_id = p.topic_id);

-- ---------------------------------------------------------------------
-- 3. Everything the administrator's dashboard shows, for the last p_days days,
--    compared with the p_days before that.
-- ---------------------------------------------------------------------
create or replace function public.admin_insights(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  d int := greatest(1, least(coalesce(p_days, 30), 365));
  t_now timestamptz := now();
  t_from timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
  t_prev timestamptz := now() - make_interval(days => 2 * greatest(1, least(coalesce(p_days, 30), 365)));
  v_term int := case when extract(month from now() at time zone 'Africa/Lagos') >= 9 then 1
                     when extract(month from now() at time zone 'Africa/Lagos') <= 4 then 2 else 3 end;
  v jsonb;
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;

  with activity as (
    select student_id, created_at from public.learning_events
    union all select student_id, created_at from public.points_ledger
    union all select student_id, started_at from public.exam_attempts
  )
  select jsonb_build_object(
    'days', d,
    'term', v_term,
    'kpis', jsonb_build_object(
      'signups', (select count(*) from public.profiles where created_at >= t_from),
      'signups_prev', (select count(*) from public.profiles where created_at >= t_prev and created_at < t_from),
      'active', (select count(distinct student_id) from activity where created_at >= t_from),
      'active_prev', (select count(distinct student_id) from activity where created_at >= t_prev and created_at < t_from),
      'videos', (select count(*) from public.learning_events where kind = 'video' and created_at >= t_from),
      'videos_prev', (select count(*) from public.learning_events where kind = 'video' and created_at >= t_prev and created_at < t_from),
      'quizzes', (select count(*) from public.learning_events where kind = 'quiz' and created_at >= t_from)
                 + (select count(*) from public.exam_attempts where started_at >= t_from),
      'quizzes_prev', (select count(*) from public.learning_events where kind = 'quiz' and created_at >= t_prev and created_at < t_from)
                 + (select count(*) from public.exam_attempts where started_at >= t_prev and started_at < t_from),
      'revenue', (select coalesce(sum(amount_kobo), 0) from public.payments where status = 'success' and coalesce(verified_at, created_at) >= t_from),
      'revenue_prev', (select coalesce(sum(amount_kobo), 0) from public.payments where status = 'success' and coalesce(verified_at, created_at) >= t_prev and coalesce(verified_at, created_at) < t_from),
      'pupils', (select count(*) from public.profiles where role = 'student'),
      'parents', (select count(*) from public.profiles where role = 'parent'),
      'teachers', (select count(*) from public.profiles where role = 'teacher' and status = 'active'),
      'rating', (select round(avg(stars)::numeric, 1) from public.topic_ratings),
      'ratings', (select count(*) from public.topic_ratings)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', day,
        'signups', (select count(*) from public.profiles p where (p.created_at at time zone 'Africa/Lagos')::date = day),
        'videos', (select count(*) from public.learning_events e where e.kind = 'video' and (e.created_at at time zone 'Africa/Lagos')::date = day),
        'quizzes', (select count(*) from public.learning_events e where e.kind = 'quiz' and (e.created_at at time zone 'Africa/Lagos')::date = day)
                   + (select count(*) from public.exam_attempts a where (a.started_at at time zone 'Africa/Lagos')::date = day)
      ) order by day), '[]'::jsonb)
      from (select generate_series((t_now at time zone 'Africa/Lagos')::date - (d - 1), (t_now at time zone 'Africa/Lagos')::date, interval '1 day')::date as day) s
    ),
    'classes', (
      select coalesce(jsonb_agg(x order by x.sort_order), '[]'::jsonb) from (
        select c.code, c.name, c.sort_order,
          (select count(*) from public.students s where s.class_id = c.id) as pupils,
          (select count(distinct a.student_id) from activity a join public.students s on s.profile_id = a.student_id
             where s.class_id = c.id and a.created_at >= t_from) as active,
          (select count(*) from public.teacher_classes tc join public.profiles p on p.id = tc.teacher_id and p.status = 'active' where tc.class_id = c.id) as teachers,
          (select count(*) from public.curriculum_topics t where t.class_id = c.id and t.term = v_term and t.is_published) as term_topics,
          (select count(*) from public.topic_progress tp join public.students s on s.profile_id = tp.student_id
             join public.curriculum_topics t on t.id = tp.topic_id
             where s.class_id = c.id and t.class_id = c.id and t.term = v_term and tp.completed_at is not null) as term_done
        from public.classes c where c.is_active
      ) x
    ),
    'coverage', (
      select coalesce(jsonb_agg(x order by x.sort_order, x.subject_order), '[]'::jsonb) from (
        select c.code as class_code, c.name as class_name, c.sort_order, s.code as subject_code, s.name as subject_name,
          array_position(array['english', 'mathematics', 'basic-science'], s.code) as subject_order,
          count(t.id) as topics,
          count(t.id) filter (where exists (select 1 from public.class_videos v where v.topic_id = t.id and v.is_published)) as with_video,
          count(t.id) filter (where t.notes is not null) as with_notes,
          count(t.id) filter (where exists (select 1 from public.topic_questions q where q.topic_id = t.id)) as with_quiz
        from public.classes c
        cross join public.subjects s
        left join public.curriculum_topics t on t.class_id = c.id and t.subject_id = s.id and t.is_published
        where c.is_active and s.code in ('english', 'mathematics', 'basic-science')
        group by c.code, c.name, c.sort_order, s.code, s.name
      ) x
    ),
    'top_lessons', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select t.code, t.title, c.name as class_name, s.code as subject_code,
          (select coalesce(sum(v.view_count), 0) from public.class_videos v where v.topic_id = t.id) as views,
          (select count(*) from public.topic_progress p where p.topic_id = t.id and p.quiz_total is not null) as plays,
          (select round(avg(r.stars)::numeric, 1) from public.topic_ratings r where r.topic_id = t.id) as stars
        from public.curriculum_topics t join public.classes c on c.id = t.class_id join public.subjects s on s.id = t.subject_id
        order by (select coalesce(sum(v.view_count), 0) from public.class_videos v where v.topic_id = t.id)
               + 3 * (select count(*) from public.topic_progress p where p.topic_id = t.id and p.quiz_total is not null) desc, t.title
        limit 5
      ) x
    ),
    'weak_lessons', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select t.code, t.title, c.name as class_name, s.code as subject_code,
          round(avg(p.best_percent))::int as avg_score, count(*) as attempts,
          (select round(avg(r.stars)::numeric, 1) from public.topic_ratings r where r.topic_id = t.id) as stars
        from public.topic_progress p
        join public.curriculum_topics t on t.id = p.topic_id join public.classes c on c.id = t.class_id join public.subjects s on s.id = t.subject_id
        where p.quiz_total is not null
        group by t.id, t.code, t.title, c.name, s.code
        having avg(p.best_percent) < 70
        order by avg(p.best_percent), count(*) desc
        limit 5
      ) x
    ),
    'top_pupils', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select pr.full_name, c.name as class_name, st.points, count(*) as actions
        from activity a
        join public.students st on st.profile_id = a.student_id
        join public.profiles pr on pr.id = a.student_id
        left join public.classes c on c.id = st.class_id
        where a.created_at >= t_from
        group by pr.full_name, c.name, st.points
        order by count(*) desc, st.points desc
        limit 5
      ) x
    ),
    'teachers', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select p.full_name,
          (select count(*) from public.class_videos v where v.uploaded_by = p.id) as videos,
          (select count(*) from public.class_videos v where v.uploaded_by = p.id and v.created_at >= t_from) as videos_recent,
          (select coalesce(sum(v.view_count), 0) from public.class_videos v where v.uploaded_by = p.id) as views,
          (select count(*) from public.classrooms r where r.teacher_id = p.id and not r.is_archived) as classrooms,
          p.last_seen_at
        from public.profiles p
        where p.role = 'teacher' and p.status = 'active'
        order by (select count(*) from public.class_videos v where v.uploaded_by = p.id) desc, p.full_name
        limit 8
      ) x
    ),
    'attention', jsonb_build_object(
      'teachers_pending', (select count(*) from public.teachers where application_status = 'pending'),
      'reports_open', (select count(*) from public.reports where status in ('open', 'reviewing')),
      'videos_hidden', (select count(*) from public.class_videos where not is_published),
      'videos_unlinked', (select count(*) from public.class_videos where topic_id is null and is_published),
      'term_topics_no_video', (select count(*) from public.curriculum_topics t where t.term = v_term and t.is_published
                                and not exists (select 1 from public.class_videos v where v.topic_id = t.id and v.is_published)),
      'term_topics_no_notes', (select count(*) from public.curriculum_topics t where t.term = v_term and t.is_published and t.notes is null),
      'pupils_no_class', (select count(*) from public.students where class_id is null),
      'classes_no_teacher', (select count(*) from public.classes c where c.is_active
                               and exists (select 1 from public.students s where s.class_id = c.id)
                               and not exists (select 1 from public.teacher_classes tc where tc.class_id = c.id))
    )
  ) into v;
  return v;
end $$;
revoke all on function public.admin_insights(int) from public, anon;
grant execute on function public.admin_insights(int) to authenticated;
