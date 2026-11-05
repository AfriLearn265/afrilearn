-- Primary 1 to 6 edition and class videos. Run after schema.sql, functions.sql, policies.sql and seed.sql.
-- (Already applied to the live AfriLearn project on 5 November 2026. Before applying it there, every table
-- it changed was copied to the private "archive" schema, so the full Nursery to SS3 data can be restored.)

-- ---------------------------------------------------------------------
-- 1. Only Primary 1 to 6 are offered. Other classes are switched off, not deleted.
-- ---------------------------------------------------------------------
update public.classes c set is_active = (l.key = 'primary')
from public.education_levels l where l.id = c.level_id;
update public.question_banks set is_shared = false
  where exam_body is not null or class_id in (select id from public.classes where not is_active);

-- ---------------------------------------------------------------------
-- 2. Class videos: teachers and administrators share videos with a whole class.
-- ---------------------------------------------------------------------
create table public.class_videos (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (char_length(title) between 2 and 140),
  description text check (description is null or char_length(description) <= 2000),
  source text not null check (source in ('upload', 'youtube', 'link')),
  storage_path text,
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  external_url text check (external_url is null or external_url ~ '^(https://|/)'),
  thumbnail_path text,
  duration_seconds int check (duration_seconds is null or duration_seconds between 0 and 36000),
  file_size_bytes bigint,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  is_published boolean not null default true,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source = 'upload' and storage_path is not null)
      or (source = 'youtube' and youtube_id is not null)
      or (source = 'link' and external_url is not null))
);
create index class_videos_class_idx on public.class_videos (class_id, created_at desc);
create index class_videos_subject_idx on public.class_videos (subject_id);
create index class_videos_uploader_idx on public.class_videos (uploaded_by);
create index class_videos_storage_idx on public.class_videos (storage_path);
create trigger class_videos_touch before update on public.class_videos
  for each row execute function private.touch_updated_at();

-- Who may watch: staff, pupils in that class, and parents of a child in that class.
create or replace function public.can_view_class_video(p_video uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_videos v
    where v.id = p_video
      and (v.uploaded_by = auth.uid() or public.is_active_teacher()
           or (v.is_published and (
                exists (select 1 from public.students s where s.profile_id = auth.uid() and s.class_id = v.class_id)
                or exists (select 1 from public.parent_children pc join public.students s on s.profile_id = pc.student_id
                           where pc.parent_id = auth.uid() and s.class_id = v.class_id)))))
$$;
revoke all on function public.can_view_class_video(uuid) from public, anon;
grant execute on function public.can_view_class_video(uuid) to authenticated;

create or replace function public.can_read_class_video_path(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_videos v
                 where (v.storage_path = p_path or v.thumbnail_path = p_path) and public.can_view_class_video(v.id))
$$;
revoke all on function public.can_read_class_video_path(text) from public, anon;
grant execute on function public.can_read_class_video_path(text) to authenticated;

alter table public.class_videos enable row level security;
grant select, insert, update, delete on public.class_videos to authenticated;
revoke update (view_count) on public.class_videos from authenticated;

create policy "class_videos: read" on public.class_videos for select to authenticated
  using (public.can_view_class_video(id));
create policy "class_videos: staff add" on public.class_videos for insert to authenticated
  with check ((select public.is_active_teacher()) and uploaded_by = (select auth.uid()));
create policy "class_videos: edit own" on public.class_videos for update to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()))
  with check (uploaded_by = (select auth.uid()) or (select public.is_admin()));
create policy "class_videos: delete own" on public.class_videos for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()));

-- Count a view (pupils and parents only, so staff previews don't inflate the number).
create or replace function public.record_video_view(p_video uuid)
returns void language sql security definer set search_path = '' as $$
  update public.class_videos set view_count = view_count + 1
  where id = p_video and public.can_view_class_video(id)
    and public.current_user_role() in ('student', 'parent');
$$;
revoke all on function public.record_video_view(uuid) from public, anon;
grant execute on function public.record_video_view(uuid) to authenticated;

-- Tell pupils when a new video is added for their class.
create or replace function private.on_class_video()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record; v_subject text;
begin
  if not new.is_published then return new; end if;
  select name into v_subject from public.subjects where id = new.subject_id;
  for r in select s.profile_id from public.students s join public.profiles p on p.id = s.profile_id
           where s.class_id = new.class_id and p.status = 'active' loop
    perform private.notify(r.profile_id, 'New video: ' || new.title,
      coalesce(v_subject || ' video for your class', 'A new video for your class'), '/student/videos/' || new.id, 'video');
  end loop;
  return new;
end $$;
create trigger notify_class_video after insert on public.class_videos
  for each row execute function private.on_class_video();

-- Private bucket for uploaded class videos and their poster frames.
-- The 50 MB limit is the most a free Supabase project allows per file; raise it on the Pro plan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('class-videos', 'class-videos', false, 52428800,
   array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "class-videos: read" on storage.objects for select to authenticated using (
  bucket_id = 'class-videos' and ((storage.foldername(name))[1] = (select auth.uid())::text
                                  or (select public.is_admin()) or public.can_read_class_video_path(name)));
create policy "class-videos: upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'class-videos' and (select public.is_active_teacher()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "class-videos: update own" on storage.objects for update to authenticated
  using (bucket_id = 'class-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "class-videos: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'class-videos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- ---------------------------------------------------------------------
-- 3. Catalogue functions only list offered classes.
-- ---------------------------------------------------------------------
create or replace function public.catalogue_courses(p_limit int default 6)
returns table (id uuid, title text, slug text, summary text, difficulty text,
               subject_name text, subject_color text, class_name text, lesson_count int)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.slug, c.summary, c.difficulty, s.name, s.color, k.name,
         (select count(*)::int from public.lessons l where l.course_id = c.id and l.is_published)
  from public.courses c
  left join public.subjects s on s.id = c.subject_id
  left join public.classes k on k.id = c.class_id
  where c.is_published and c.classroom_id is null and (k.id is null or k.is_active)
  order by c.is_featured desc, k.sort_order nulls last, c.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 24)
$$;

create or replace function public.public_resources()
returns table (id uuid, title text, description text, material_type text, url text, library_category text,
               subject_name text, class_name text, class_sort int, file_size_bytes bigint, license_note text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.id, m.title, m.description, m.material_type,
         coalesce(m.external_url, '/api/files/materials?path=' || m.storage_path || '&download=1'),
         m.library_category, s.name, k.name, k.sort_order, m.file_size_bytes, m.license_note, m.created_at
  from public.learning_materials m
  left join public.subjects s on s.id = m.subject_id
  left join public.classes k on k.id = m.class_id
  where m.audience = 'public' and m.is_approved and m.course_id is null and m.classroom_id is null
    and (k.id is null or k.is_active)
  order by k.sort_order nulls last, m.library_category, m.title
$$;

create or replace function public.cbt_catalogue()
returns table (exam_body text, subject_id uuid, subject_name text, topic text, question_count bigint)
language sql stable security definer set search_path = '' as $$
  select null::text as exam_body, q.subject_id, s.name, coalesce(q.topic, 'General'), count(*)
  from public.questions q
  join public.question_banks b on b.id = q.bank_id and b.is_shared and b.exam_body is null
  left join public.classes k on k.id = b.class_id
  join public.subjects s on s.id = q.subject_id
  where q.question_type in ('mcq', 'true_false')
    and (k.id is null or k.is_active)
    and exists (select 1 from public.question_answer_keys qk where qk.question_id = q.id and cardinality(qk.correct_option_ids) > 0)
    and auth.uid() is not null
  group by 2, 3, 4
  order by 3, 4
$$;
revoke execute on function public.cbt_catalogue() from public, anon;
grant execute on function public.cbt_catalogue() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Plans rewritten for the Primary edition (keys unchanged so payments keep working).
-- ---------------------------------------------------------------------
update public.subscription_plans p set name = v.name, description = v.description, features = v.features
from (values
  ('free', 'Free for every pupil', 'Start learning at no cost.',
   array['Class videos for your class', 'Short lessons and courses', 'Practice quizzes with explanations', 'Progress, points and badges']),
  ('standard', 'Standard pupil', 'Everything a pupil needs for the school term.',
   array['Everything in Free', 'Assignments with teacher feedback', 'Printable worksheets and notes', 'Timed quiz challenges']),
  ('premium', 'Premium pupil', 'Live teaching and Tiko, the learning helper.',
   array['Everything in Standard', 'Live classes with teachers', 'Ask Tiko, the learning helper', 'Certificates for finished courses']),
  ('exam-prep', 'Common Entrance (Primary 6)', 'Focused preparation for the Common Entrance examination.',
   array['Common Entrance style practice papers', 'Timed practice in English, Maths and reasoning', 'Reports on strong and weak topics', 'A review of every wrong answer']),
  ('teacher', 'Teacher account', 'Free for approved teachers.',
   array['Unlimited classrooms', 'Upload class videos', 'Quizzes that mark themselves', 'Gradebook, attendance and live classes']),
  ('school', 'Primary school', 'For schools enrolling whole classes, Primary 1 to 6.',
   array['Every feature for all pupils and teachers', 'A dashboard for the head teacher', 'Help setting up every class and teacher', 'Priority support'])
) as v(key, name, description, features)
where p.key = v.key;

-- ---------------------------------------------------------------------
-- 5. Who watched which video (one row per pupil per video).
-- ---------------------------------------------------------------------
create table public.video_views (
  video_id uuid not null references public.class_videos (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  plays int not null default 1 check (plays > 0),
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (video_id, student_id)
);
create index video_views_student_idx on public.video_views (student_id, last_viewed_at desc);
alter table public.video_views enable row level security;
grant select on public.video_views to authenticated;
create policy "video_views: read" on public.video_views for select to authenticated using (
  student_id = (select auth.uid())
  or public.is_parent_of(student_id)
  or (select public.is_admin())
  or exists (select 1 from public.class_videos v
             where v.id = video_id
               and (v.uploaded_by = (select auth.uid())
                    or exists (select 1 from public.teacher_classes tc where tc.teacher_id = (select auth.uid()) and tc.class_id = v.class_id))));

-- Pupils' plays are recorded against their name (2 points the first time); parents' plays only add to the total.
create or replace function public.record_video_view(p_video uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text := public.current_user_role(); v_title text; v_new boolean;
begin
  if v_role not in ('student', 'parent') or not public.can_view_class_video(p_video) then return; end if;
  update public.class_videos set view_count = view_count + 1 where id = p_video returning title into v_title;
  if v_role = 'student' then
    insert into public.video_views (video_id, student_id) values (p_video, auth.uid())
    on conflict (video_id, student_id) do update set plays = public.video_views.plays + 1, last_viewed_at = now()
    returning (xmax = 0) into v_new;
    if v_new then
      perform private.award_points(auth.uid(), 2, 'Watched: ' || v_title, 'class_video', p_video);
    end if;
    perform private.touch_streak(auth.uid());
  end if;
end $$;
revoke all on function public.record_video_view(uuid) from public, anon;
grant execute on function public.record_video_view(uuid) to authenticated;

-- For the class's teachers and administrators: every pupil in the class and whether they have watched.
create or replace function public.video_watch_report(p_video uuid)
returns table (student_id uuid, full_name text, plays int, last_viewed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v public.class_videos;
begin
  select * into v from public.class_videos where id = p_video;
  if not found then return; end if;
  if not (public.is_admin() or v.uploaded_by = auth.uid()
          or exists (select 1 from public.teacher_classes tc where tc.teacher_id = auth.uid() and tc.class_id = v.class_id)) then
    raise exception 'Only the class''s teachers and administrators can see who watched.';
  end if;
  return query
  select s.profile_id, p.full_name, coalesce(w.plays, 0), w.last_viewed_at
  from public.students s
  join public.profiles p on p.id = s.profile_id and p.status = 'active'
  left join public.video_views w on w.video_id = v.id and w.student_id = s.profile_id
  where s.class_id = v.class_id
  order by w.last_viewed_at desc nulls last, p.full_name;
end $$;
revoke all on function public.video_watch_report(uuid) from public, anon;
grant execute on function public.video_watch_report(uuid) to authenticated;
