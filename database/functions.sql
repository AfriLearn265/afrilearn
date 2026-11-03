-- =====================================================================
-- AfriLearn — functions, triggers and secure RPCs
-- Everything that must not be trusted to the browser runs here:
-- sign-up role assignment, role changes, exam marking, assignment
-- deadlines, grading, points, payments confirmation.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Access helpers (used by RLS policies). SECURITY DEFINER so they can
-- read across tables without recursive policy checks.
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active')
$$;

create or replace function public.is_active_teacher()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin') and status = 'active')
$$;

create or replace function public.is_classroom_teacher(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classrooms where id = p_classroom and teacher_id = auth.uid())
$$;

create or replace function public.is_classroom_member(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments
                 where classroom_id = p_classroom and student_id = auth.uid() and status = 'active')
$$;

create or replace function public.is_parent_of(p_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.parent_children where parent_id = auth.uid() and student_id = p_student)
$$;

create or replace function public.teaches_student(p_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
                 join public.classrooms c on c.id = e.classroom_id
                 where e.student_id = p_student and e.status = 'active' and c.teacher_id = auth.uid())
$$;

create or replace function public.parent_has_child_in(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
                 join public.parent_children pc on pc.student_id = e.student_id
                 where e.classroom_id = p_classroom and e.status = 'active' and pc.parent_id = auth.uid())
$$;

create or replace function public.can_edit_course(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.courses c
    where c.id = p_course
      and (c.teacher_id = auth.uid() or (c.classroom_id is not null and public.is_classroom_teacher(c.classroom_id))))
$$;

create or replace function public.can_view_course(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.can_edit_course(p_course) or exists (
    select 1 from public.courses c
    where c.id = p_course and c.is_published
      and (c.classroom_id is null
           or public.is_classroom_member(c.classroom_id)
           or public.parent_has_child_in(c.classroom_id)))
$$;

create or replace function public.can_view_material(p_material uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.learning_materials m
    where m.id = p_material
      and (
        m.uploaded_by = auth.uid() or public.is_admin()
        or (m.is_approved and (
              (m.audience = 'teachers' and public.is_active_teacher())
              or (m.audience <> 'teachers' and (
                    (m.course_id is not null and public.can_view_course(m.course_id))
                    or (m.classroom_id is not null and (public.is_classroom_member(m.classroom_id)
                         or public.is_classroom_teacher(m.classroom_id) or public.parent_has_child_in(m.classroom_id)))
                    or (m.course_id is null and m.classroom_id is null and auth.uid() is not null))))))
  )
$$;

create or replace function public.can_read_material_path(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.learning_materials m where m.storage_path = p_path and public.can_view_material(m.id))
      or exists (select 1 from public.lessons l where l.video_path = p_path and public.can_view_course(l.course_id))
      or exists (select 1 from public.assignments a where p_path = any (a.attachment_paths)
                 and (public.is_classroom_member(a.classroom_id) or public.is_classroom_teacher(a.classroom_id)
                      or public.parent_has_child_in(a.classroom_id) or public.is_admin()))
$$;

create or replace function public.can_read_submission_path(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin()
      or split_part(p_path, '/', 1) = auth.uid()::text
      or exists (select 1 from public.assignments a
                 where a.id::text = split_part(p_path, '/', 2) and public.is_classroom_teacher(a.classroom_id))
      or (case when split_part(p_path, '/', 1) ~ '^[0-9a-f-]{36}$'
               then public.is_parent_of(split_part(p_path, '/', 1)::uuid) else false end)
$$;

create or replace function public.can_edit_exam(p_exam uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.examinations e
    where e.id = p_exam and e.owner_student_id is null
      and (e.created_by = auth.uid() or (e.classroom_id is not null and public.is_classroom_teacher(e.classroom_id))))
$$;

create or replace function public.can_view_question(p_question uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.questions q
    left join public.question_banks b on b.id = q.bank_id
    where q.id = p_question
      and (q.created_by = auth.uid() or b.owner_id = auth.uid()
           or (b.is_shared and public.is_active_teacher())))
$$;

create or replace function public.can_edit_question(p_question uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.questions q
    left join public.question_banks b on b.id = q.bank_id
    where q.id = p_question and (q.created_by = auth.uid() or b.owner_id = auth.uid()))
$$;

-- ---------------------------------------------------------------------
-- Internal helpers (private schema: not callable from the API)
-- ---------------------------------------------------------------------
create or replace function private.log_activity(p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'));
$$;

create or replace function private.notify(p_user uuid, p_title text, p_body text, p_link text, p_category text default 'general')
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, body, link, category)
  select p_user, p_title, p_body, p_link, p_category where p_user is not null;
$$;

create or replace function private.notify_parents(p_student uuid, p_title text, p_body text, p_link text, p_category text default 'general')
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, body, link, category)
  select parent_id, p_title, p_body, p_link, p_category from public.parent_children where student_id = p_student;
$$;

create or replace function private.notify_classroom(p_classroom uuid, p_title text, p_body text, p_link text, p_category text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, body, link, category)
  select e.student_id, p_title, p_body, p_link, p_category
  from public.enrollments e where e.classroom_id = p_classroom and e.status = 'active'
  union
  select pc.parent_id, p_title, p_body, '/parent', p_category
  from public.enrollments e join public.parent_children pc on pc.student_id = e.student_id
  where e.classroom_id = p_classroom and e.status = 'active';
$$;

create or replace function private.award_badge(p_student uuid, p_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_badge public.badges;
begin
  select * into v_badge from public.badges where key = p_key;
  if not found then return; end if;
  insert into public.student_badges (student_id, badge_id) values (p_student, v_badge.id)
  on conflict do nothing;
  if found then
    perform private.notify(p_student, 'New badge: ' || v_badge.name, v_badge.description, '/student/achievements', 'achievement');
  end if;
end $$;

create or replace function private.award_points(p_student uuid, p_points int, p_reason text, p_ref_type text default null, p_ref_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_total int;
begin
  if p_points = 0 then return; end if;
  if p_ref_id is not null and exists (select 1 from public.points_ledger
     where student_id = p_student and ref_type = p_ref_type and ref_id = p_ref_id) then
    return; -- points for this item were already awarded
  end if;
  insert into public.points_ledger (student_id, points, reason, ref_type, ref_id)
  values (p_student, p_points, p_reason, p_ref_type, p_ref_id);
  update public.students set points = points + p_points where profile_id = p_student
  returning points into v_total;
  perform private.award_badge(p_student, 'first_steps');
  if v_total >= 100 then perform private.award_badge(p_student, 'century'); end if;
  if v_total >= 500 then perform private.award_badge(p_student, 'scholar'); end if;
end $$;

create or replace function private.touch_streak(p_student uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_last date;
  v_streak int;
begin
  select last_active_on into v_last from public.students where profile_id = p_student for update;
  if v_last = v_today then return; end if;
  update public.students
     set streak_days = case when v_last = v_today - 1 then streak_days + 1 else 1 end,
         last_active_on = v_today
   where profile_id = p_student
  returning streak_days into v_streak;
  if v_streak >= 7 then perform private.award_badge(p_student, 'streak_7'); end if;
end $$;

create or replace function private.waec_grade(p numeric)
returns text language sql immutable set search_path = '' as $$
  select case when p >= 75 then 'A1' when p >= 70 then 'B2' when p >= 65 then 'B3'
              when p >= 60 then 'C4' when p >= 55 then 'C5' when p >= 50 then 'C6'
              when p >= 45 then 'D7' when p >= 40 then 'E8' else 'F9' end
$$;

-- ---------------------------------------------------------------------
-- Sign-up: create the profile and role record. Role comes from sign-up
-- metadata but can only ever be student, teacher (pending) or parent.
-- ---------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}');
  v_role text := coalesce(m ->> 'role', 'student');
  v_name text := left(coalesce(nullif(trim(m ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120);
  v_consent boolean := lower(coalesce(m ->> 'guardian_consent', 'false')) in ('true', 'on', '1', 'yes');
begin
  if v_role not in ('student', 'teacher', 'parent') then
    v_role := 'student';
  end if;

  insert into public.profiles (id, role, status, full_name)
  values (new.id, v_role, case when v_role = 'teacher' then 'pending' else 'active' end, v_name);

  if v_role = 'student' then
    insert into public.students (profile_id, class_id, interests, guardian_name, guardian_email, guardian_consent, guardian_consent_at)
    values (
      new.id,
      (select id from public.classes where code = m ->> 'class_code'),
      case when jsonb_typeof(m -> 'interests') = 'array'
           then array(select left(x, 60) from jsonb_array_elements_text(m -> 'interests') x limit 20)
           else '{}' end,
      left(m ->> 'guardian_name', 120),
      left(m ->> 'guardian_email', 200),
      v_consent,
      case when v_consent then now() end);

  elsif v_role = 'teacher' then
    insert into public.teachers (profile_id, phone, qualification, institution, years_experience, bio)
    values (
      new.id,
      left(m ->> 'phone', 30),
      left(m ->> 'qualification', 200),
      left(m ->> 'institution', 200),
      case when (m ->> 'years_experience') ~ '^\d{1,2}$' then (m ->> 'years_experience')::int end,
      left(m ->> 'bio', 2000));
    if jsonb_typeof(m -> 'subject_codes') = 'array' then
      insert into public.teacher_subjects (teacher_id, subject_id)
      select new.id, s.id from public.subjects s
      where s.code in (select jsonb_array_elements_text(m -> 'subject_codes'))
      on conflict do nothing;
    end if;
    if jsonb_typeof(m -> 'class_codes') = 'array' then
      insert into public.teacher_classes (teacher_id, class_id)
      select new.id, c.id from public.classes c
      where c.code in (select jsonb_array_elements_text(m -> 'class_codes'))
      on conflict do nothing;
    end if;

  else
    insert into public.parents (profile_id, phone) values (new.id, left(m ->> 'phone', 30));
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (new.id, 'account.created', 'profile', new.id, jsonb_build_object('role', v_role));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Notify classroom members when teachers post.
create or replace function private.on_classroom_post()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'announcements' then
    perform private.notify_classroom(new.classroom_id, new.title, left(new.body, 160), '/student/classes/' || new.classroom_id, 'announcement');
  elsif tg_table_name = 'assignments' then
    if new.is_published then
      perform private.notify_classroom(new.classroom_id, 'New assignment: ' || new.title,
        'Due ' || to_char(new.due_at at time zone 'Africa/Lagos', 'Dy DD Mon, HH12:MI AM'), '/student/assignments/' || new.id, 'assignment');
    end if;
  elsif tg_table_name = 'live_classes' then
    perform private.notify_classroom(new.classroom_id, 'Live class scheduled: ' || new.title,
      to_char(new.starts_at at time zone 'Africa/Lagos', 'Dy DD Mon, HH12:MI AM'), '/student/live', 'live_class');
  end if;
  return new;
end $$;

create trigger notify_announcement after insert on public.announcements
  for each row execute function private.on_classroom_post();
create trigger notify_assignment after insert on public.assignments
  for each row execute function private.on_classroom_post();
create trigger notify_live_class after insert on public.live_classes
  for each row execute function private.on_classroom_post();

-- ---------------------------------------------------------------------
-- Student & parent RPCs
-- ---------------------------------------------------------------------
create or replace function public.join_classroom(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.classrooms;
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'Only student accounts can join a classroom.';
  end if;
  select * into v_room from public.classrooms where join_code = upper(trim(p_code)) and not is_archived;
  if not found then
    raise exception 'No classroom uses the code %. Check the code with your teacher.', upper(trim(p_code));
  end if;
  insert into public.enrollments (classroom_id, student_id) values (v_room.id, auth.uid())
  on conflict (classroom_id, student_id) do update set status = 'active';
  perform private.notify(v_room.teacher_id, 'New student joined ' || v_room.name,
    (select full_name from public.profiles where id = auth.uid()) || ' joined with your class code.', '/teacher/classrooms/' || v_room.id, 'classroom');
  perform private.log_activity('classroom.joined', 'classroom', v_room.id);
  return jsonb_build_object('id', v_room.id, 'name', v_room.name);
end $$;

create or replace function public.link_child(p_code text, p_relationship text default 'guardian')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_student uuid; v_name text;
begin
  if public.current_user_role() is distinct from 'parent' then
    raise exception 'Only parent or guardian accounts can link a child.';
  end if;
  select s.profile_id, p.full_name into v_student, v_name
  from public.students s join public.profiles p on p.id = s.profile_id
  where s.link_code = upper(trim(p_code));
  if v_student is null then
    raise exception 'No student uses the link code %. Ask your child to copy it from their profile page.', upper(trim(p_code));
  end if;
  insert into public.parent_children (parent_id, student_id, relationship)
  values (auth.uid(), v_student, left(coalesce(nullif(trim(p_relationship), ''), 'guardian'), 40))
  on conflict (parent_id, student_id) do nothing;
  perform private.notify(v_student, 'A parent account is now linked to you',
    (select full_name from public.profiles where id = auth.uid()) || ' can now see your progress.', '/student/profile', 'account');
  perform private.log_activity('parent.linked_child', 'student', v_student);
  return jsonb_build_object('id', v_student, 'name', v_name);
end $$;

create or replace function public.regenerate_link_code()
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  update public.students set link_code = public.gen_code(8) where profile_id = auth.uid()
  returning link_code into v_code;
  if v_code is null then raise exception 'Only students have a link code.'; end if;
  return v_code;
end $$;

create or replace function public.update_lesson_progress(p_lesson uuid, p_percent int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_lesson public.lessons;
  v_prev public.lesson_progress;
  v_pct int := greatest(0, least(100, coalesce(p_percent, 0)));
  v_total int; v_done int; v_course_title text;
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'Only students track lesson progress.';
  end if;
  select * into v_lesson from public.lessons where id = p_lesson and is_published;
  if not found or not public.can_view_course(v_lesson.course_id) then
    raise exception 'This lesson is not available to you.';
  end if;
  select * into v_prev from public.lesson_progress where student_id = auth.uid() and lesson_id = p_lesson;
  if v_prev.status = 'completed' then
    return jsonb_build_object('status', 'completed', 'progress_percent', 100);
  end if;

  insert into public.lesson_progress (student_id, lesson_id, status, progress_percent, completed_at)
  values (auth.uid(), p_lesson, case when v_pct = 100 then 'completed' else 'in_progress' end, v_pct,
          case when v_pct = 100 then now() end)
  on conflict (student_id, lesson_id) do update
    set progress_percent = greatest(public.lesson_progress.progress_percent, excluded.progress_percent),
        status = excluded.status, completed_at = excluded.completed_at;

  perform private.touch_streak(auth.uid());

  if v_pct = 100 then
    perform private.award_points(auth.uid(), 10, 'Completed lesson: ' || v_lesson.title, 'lesson', p_lesson);
    select count(*), count(lp.lesson_id) filter (where lp.status = 'completed')
      into v_total, v_done
    from public.lessons l
    left join public.lesson_progress lp on lp.lesson_id = l.id and lp.student_id = auth.uid()
    where l.course_id = v_lesson.course_id and l.is_published;
    if v_total > 0 and v_total = v_done
       and not exists (select 1 from public.certificates where student_id = auth.uid() and course_id = v_lesson.course_id) then
      select title into v_course_title from public.courses where id = v_lesson.course_id;
      insert into public.certificates (student_id, course_id, title, description)
      values (auth.uid(), v_lesson.course_id, v_course_title, 'Completed every lesson in ' || v_course_title);
      perform private.award_points(auth.uid(), 50, 'Completed course: ' || v_course_title, 'course', v_lesson.course_id);
      perform private.award_badge(auth.uid(), 'course_complete');
      perform private.notify(auth.uid(), 'Certificate earned', 'You completed ' || v_course_title || '.', '/student/achievements', 'achievement');
      perform private.notify_parents(auth.uid(), 'Course completed',
        (select full_name from public.profiles where id = auth.uid()) || ' completed ' || v_course_title || '.', '/parent', 'achievement');
    end if;
  end if;
  return jsonb_build_object('status', case when v_pct = 100 then 'completed' else 'in_progress' end, 'progress_percent', v_pct);
end $$;

create or replace function public.submit_assignment(p_assignment uuid, p_files text[], p_text text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.assignments;
  v_prev public.assignment_submissions;
  v_late boolean;
  v_path text;
  v_ext text;
  v_files text[] := coalesce(p_files, '{}');
begin
  select * into a from public.assignments where id = p_assignment and is_published;
  if not found or not public.is_classroom_member(a.classroom_id) then
    raise exception 'This assignment is not available to you.';
  end if;
  v_late := now() > a.due_at;
  if v_late and not a.allow_late then
    raise exception 'Submissions closed on %.', to_char(a.due_at at time zone 'Africa/Lagos', 'Dy DD Mon YYYY, HH12:MI AM');
  end if;
  if cardinality(v_files) = 0 and coalesce(trim(p_text), '') = '' then
    raise exception 'Attach a file or type your answer before submitting.';
  end if;
  if cardinality(v_files) > 5 then
    raise exception 'You can attach up to 5 files.';
  end if;
  foreach v_path in array v_files loop
    if split_part(v_path, '/', 1) <> auth.uid()::text or split_part(v_path, '/', 2) <> p_assignment::text then
      raise exception 'File % was not uploaded for this assignment.', v_path;
    end if;
    v_ext := lower(substring(v_path from '\.([A-Za-z0-9]+)$'));
    if v_ext is null or not (v_ext = any (a.accepted_file_types)) then
      raise exception 'Files of type .% are not accepted. Allowed: %.', coalesce(v_ext, '?'), array_to_string(a.accepted_file_types, ', ');
    end if;
  end loop;

  select * into v_prev from public.assignment_submissions where assignment_id = p_assignment and student_id = auth.uid();
  if found and v_prev.status = 'graded' then
    raise exception 'This assignment has already been graded, so it can no longer be changed.';
  end if;

  insert into public.assignment_submissions (assignment_id, student_id, file_paths, text_answer, status, submitted_at, is_late)
  values (p_assignment, auth.uid(), v_files, left(p_text, 20000), case when v_late then 'late' else 'submitted' end, now(), v_late)
  on conflict (assignment_id, student_id) do update
    set file_paths = excluded.file_paths, text_answer = excluded.text_answer, status = excluded.status,
        submitted_at = excluded.submitted_at, is_late = excluded.is_late;

  perform private.touch_streak(auth.uid());
  perform private.award_points(auth.uid(), case when v_late then 5 else 15 end, 'Submitted: ' || a.title, 'assignment', p_assignment);
  perform private.notify(a.teacher_id, 'New submission: ' || a.title,
    (select full_name from public.profiles where id = auth.uid()) || case when v_late then ' submitted late.' else ' submitted on time.' end,
    '/teacher/assignments/' || a.id, 'submission');
  perform private.log_activity('assignment.submitted', 'assignment', p_assignment, jsonb_build_object('late', v_late));
  return jsonb_build_object('status', case when v_late then 'late' else 'submitted' end, 'submitted_at', now());
end $$;

create or replace function public.grade_submission(p_submission uuid, p_score numeric, p_feedback text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.assignment_submissions; a public.assignments;
begin
  select * into s from public.assignment_submissions where id = p_submission;
  if not found then raise exception 'Submission not found.'; end if;
  select * into a from public.assignments where id = s.assignment_id;
  if not (public.is_classroom_teacher(a.classroom_id) or public.is_admin()) then
    raise exception 'Only the class teacher can grade this submission.';
  end if;
  if p_score is null or p_score < 0 or p_score > a.total_marks then
    raise exception 'Score must be between 0 and %.', a.total_marks;
  end if;
  update public.assignment_submissions
     set score = p_score, feedback = left(p_feedback, 5000), status = 'graded', graded_by = auth.uid(), graded_at = now()
   where id = p_submission;
  perform private.notify(s.student_id, 'Graded: ' || a.title, 'You scored ' || p_score || ' / ' || a.total_marks || '.', '/student/assignments/' || a.id, 'grade');
  perform private.notify_parents(s.student_id, 'Assignment graded: ' || a.title,
    (select full_name from public.profiles where id = s.student_id) || ' scored ' || p_score || ' / ' || a.total_marks || '.', '/parent', 'grade');
  perform private.log_activity('assignment.graded', 'assignment_submission', p_submission, jsonb_build_object('score', p_score));
  return jsonb_build_object('status', 'graded', 'score', p_score);
end $$;

-- Students can join as soon as their teacher starts a class, even if that is earlier than
-- scheduled, and a class the teacher is still running stays open for an hour past its slot.
create or replace function public.check_in_live_class(p_live uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare lc public.live_classes; v_status text; v_live boolean;
begin
  select * into lc from public.live_classes where id = p_live;
  if not found then raise exception 'Live class not found.'; end if;
  if public.is_classroom_teacher(lc.classroom_id) then
    if lc.status = 'scheduled' then
      update public.live_classes set status = 'live', updated_at = now() where id = p_live;
      perform private.notify_classroom(lc.classroom_id, 'Live now: ' || lc.title,
        'Your teacher has started the class. Open Live classes to join.', '/student/live', 'live_class');
    end if;
    return jsonb_build_object('room_name', lc.room_name, 'role', 'teacher');
  end if;
  if not public.is_classroom_member(lc.classroom_id) then
    raise exception 'This live class is for another classroom.';
  end if;
  if lc.status = 'cancelled' then raise exception 'This live class was cancelled.'; end if;
  if lc.status = 'ended' then raise exception 'This class has ended.'; end if;
  v_live := lc.status = 'live';
  if not v_live and now() < lc.starts_at - interval '15 minutes' then
    raise exception 'This class opens 15 minutes before it starts, or as soon as your teacher starts it.';
  end if;
  if now() > lc.starts_at + make_interval(mins => lc.duration_minutes + case when v_live then 60 else 0 end) then
    raise exception 'This class has ended.';
  end if;
  v_status := case when now() > lc.starts_at + interval '10 minutes' then 'late' else 'present' end;
  insert into public.attendance (classroom_id, student_id, live_class_id, status, marked_by)
  values (lc.classroom_id, auth.uid(), lc.id, v_status, auth.uid())
  on conflict do nothing;
  perform private.touch_streak(auth.uid());
  return jsonb_build_object('room_name', lc.room_name, 'role', 'student', 'attendance', v_status);
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql security definer set search_path = '' as $$
  update public.notifications set is_read = true
  where user_id = auth.uid() and not is_read and (p_ids is null or id = any (p_ids));
$$;

create or replace function public.student_topic_mastery(p_student uuid default null)
returns table (subject_id uuid, subject_name text, topic text, answered bigint, correct bigint, percent numeric)
language plpgsql stable security definer set search_path = '' as $$
declare v_student uuid := coalesce(p_student, auth.uid());
begin
  if not (v_student = auth.uid() or public.is_parent_of(v_student) or public.teaches_student(v_student) or public.is_admin()) then
    raise exception 'Not allowed.';
  end if;
  return query
    select q.subject_id, s.name, coalesce(q.topic, 'General'), count(*),
           count(*) filter (where sa.is_correct),
           round(100.0 * count(*) filter (where sa.is_correct) / count(*), 1)
    from public.student_answers sa
    join public.exam_attempts ea on ea.id = sa.attempt_id
    join public.questions q on q.id = sa.question_id
    left join public.subjects s on s.id = q.subject_id
    where ea.student_id = v_student and sa.is_correct is not null
    group by q.subject_id, s.name, coalesce(q.topic, 'General')
    order by 6 asc;
end $$;

create or replace function public.classroom_leaderboard(p_classroom uuid)
returns table (rank bigint, display_name text, points int, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not coalesce((select (value)::text::boolean from public.platform_settings where key = 'leaderboards_enabled'), false) then
    raise exception 'Leaderboards are turned off for this platform.';
  end if;
  if not exists (select 1 from public.classrooms where id = p_classroom and leaderboard_enabled) then
    raise exception 'This classroom does not use a leaderboard.';
  end if;
  if not (public.is_classroom_member(p_classroom) or public.is_classroom_teacher(p_classroom) or public.is_admin()) then
    raise exception 'Not allowed.';
  end if;
  return query
    select dense_rank() over (order by s.points desc),
           split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''),
           s.points, s.profile_id = auth.uid()
    from public.enrollments e
    join public.students s on s.profile_id = e.student_id
    join public.profiles p on p.id = s.profile_id
    where e.classroom_id = p_classroom and e.status = 'active' and s.leaderboard_opt_in
    order by s.points desc
    limit 20;
end $$;

create or replace function public.verify_certificate(p_no text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('certificate_no', c.certificate_no, 'title', c.title, 'issued_at', c.issued_at,
    'holder', split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''))
  from public.certificates c join public.profiles p on p.id = c.student_id
  where c.certificate_no = upper(trim(p_no))
$$;

-- ---------------------------------------------------------------------
-- Examination engine
-- ---------------------------------------------------------------------
create or replace function private.finalize_attempt(p_attempt uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.exam_attempts; e public.examinations;
  v_score numeric; v_max numeric; v_pending int; v_pct numeric; v_grade text; v_had_result boolean;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  select * into e from public.examinations where id = a.exam_id;

  select coalesce(sum(coalesce(eq.marks, q.marks)), 0) into v_max
  from unnest(a.question_order) u(qid)
  join public.questions q on q.id = u.qid
  left join public.exam_questions eq on eq.exam_id = a.exam_id and eq.question_id = q.id;

  select coalesce(sum(awarded_marks), 0), count(*) filter (where awarded_marks is null)
    into v_score, v_pending
  from public.student_answers where attempt_id = a.id;

  v_pct := case when v_max > 0 then round(v_score * 100 / v_max, 2) else 0 end;

  update public.exam_attempts
     set score = v_score, max_score = v_max, percentage = v_pct,
         needs_manual_grading = v_pending > 0,
         status = case when v_pending > 0 then 'submitted' else 'graded' end,
         graded_at = case when v_pending > 0 then null else now() end
   where id = a.id;

  if v_pending > 0 then
    perform private.notify(e.created_by, 'Theory answers to mark: ' || e.title,
      (select full_name from public.profiles where id = a.student_id) || ' submitted answers that need manual grading.',
      '/teacher/exams/' || e.id, 'grading');
    return;
  end if;

  v_grade := private.waec_grade(v_pct);
  v_had_result := exists (select 1 from public.results where attempt_id = a.id);
  insert into public.results (attempt_id, exam_id, student_id, score, max_score, percentage, grade, passed)
  values (a.id, a.exam_id, a.student_id, v_score, v_max, v_pct, v_grade, v_pct >= e.pass_mark)
  on conflict (attempt_id) do update
    set score = excluded.score, max_score = excluded.max_score, percentage = excluded.percentage,
        grade = excluded.grade, passed = excluded.passed, published_at = now();

  if not v_had_result then
    perform private.notify(a.student_id, 'Result ready: ' || e.title, 'You scored ' || v_pct || '% (' || v_grade || ').',
      '/student/results/' || a.id, 'result');
    if e.owner_student_id is null then
      perform private.notify_parents(a.student_id, 'Result: ' || e.title,
        (select full_name from public.profiles where id = a.student_id) || ' scored ' || v_pct || '% (' || v_grade || ').', '/parent', 'result');
    end if;
    perform private.award_points(a.student_id, greatest(5, round(v_pct / 10)::int), 'Completed: ' || e.title, 'exam_attempt', a.id);
    perform private.award_badge(a.student_id, 'first_exam');
    if v_pct = 100 then perform private.award_badge(a.student_id, 'perfect_score'); end if;
  end if;
end $$;

create or replace function private.grade_attempt(p_attempt uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.exam_attempts;
  q record;
  v_ans public.student_answers;
  v_correct boolean;
  v_awarded numeric;
begin
  select * into a from public.exam_attempts where id = p_attempt for update;
  if a.status <> 'in_progress' then return; end if;

  for q in
    select qs.id, qs.question_type, coalesce(eq.marks, qs.marks) as marks,
           coalesce(k.correct_option_ids, '{}') as correct_option_ids,
           coalesce(k.accepted_answers, '{}') as accepted_answers
    from unnest(a.question_order) as u(qid)
    join public.questions qs on qs.id = u.qid
    left join public.exam_questions eq on eq.exam_id = a.exam_id and eq.question_id = qs.id
    left join public.question_answer_keys k on k.question_id = qs.id
  loop
    select * into v_ans from public.student_answers where attempt_id = a.id and question_id = q.id;
    v_correct := null;
    v_awarded := null;
    if not found or (v_ans.selected_option_id is null and coalesce(trim(v_ans.text_answer), '') = '') then
      v_correct := false; v_awarded := 0;
    elsif q.question_type in ('mcq', 'true_false') then
      v_correct := v_ans.selected_option_id = any (q.correct_option_ids);
      v_awarded := case when v_correct then q.marks else 0 end;
    elsif q.question_type = 'short_answer' and cardinality(q.accepted_answers) > 0 then
      v_correct := exists (select 1 from unnest(q.accepted_answers) x where lower(trim(x)) = lower(trim(v_ans.text_answer)));
      v_awarded := case when v_correct then q.marks else 0 end;
    end if; -- essays and open short answers stay null for the teacher

    insert into public.student_answers (attempt_id, question_id, is_correct, awarded_marks)
    values (a.id, q.id, v_correct, v_awarded)
    on conflict (attempt_id, question_id) do update
      set is_correct = excluded.is_correct, awarded_marks = excluded.awarded_marks;
  end loop;

  update public.exam_attempts
     set status = 'submitted', submitted_at = least(now(), expires_at)
   where id = a.id;

  perform private.finalize_attempt(a.id);
end $$;

create or replace function public.start_exam_attempt(p_exam uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  e public.examinations;
  v_me uuid := auth.uid();
  v_existing uuid;
  v_stale uuid;
  v_count int;
  v_order uuid[];
  v_opts jsonb;
  v_id uuid;
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'Only student accounts can take examinations.';
  end if;
  select * into e from public.examinations where id = p_exam;
  if not found or not (e.is_published or e.owner_student_id = v_me) then
    raise exception 'This examination is not available.';
  end if;
  if e.owner_student_id is not null and e.owner_student_id <> v_me then
    raise exception 'This practice session belongs to another student.';
  end if;
  if e.classroom_id is not null and not public.is_classroom_member(e.classroom_id) then
    raise exception 'This examination is for another classroom.';
  end if;
  if e.available_from is not null and now() < e.available_from then
    raise exception 'This examination opens on %.', to_char(e.available_from at time zone 'Africa/Lagos', 'Dy DD Mon YYYY, HH12:MI AM');
  end if;
  if e.available_until is not null and now() > e.available_until then
    raise exception 'This examination closed on %.', to_char(e.available_until at time zone 'Africa/Lagos', 'Dy DD Mon YYYY, HH12:MI AM');
  end if;

  -- Resume an attempt that is still running.
  select id into v_existing from public.exam_attempts
  where exam_id = p_exam and student_id = v_me and status = 'in_progress' and expires_at > now()
  order by started_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  -- Close attempts whose time ran out while the student was away.
  for v_stale in select id from public.exam_attempts
                 where exam_id = p_exam and student_id = v_me and status = 'in_progress' and expires_at <= now()
  loop
    perform private.grade_attempt(v_stale);
  end loop;

  select count(*) into v_count from public.exam_attempts where exam_id = p_exam and student_id = v_me;
  if e.max_attempts is not null and v_count >= e.max_attempts then
    raise exception 'You have used all % attempt(s) for this examination.', e.max_attempts;
  end if;

  select array_agg(question_id order by case when e.randomize_questions then random() else 0 end, sort_order)
    into v_order
  from public.exam_questions where exam_id = p_exam;
  if v_order is null then
    raise exception 'This examination has no questions yet.';
  end if;

  select coalesce(jsonb_object_agg(t.question_id, t.opts), '{}') into v_opts
  from (select ao.question_id,
               jsonb_agg(ao.id order by case when e.randomize_options then random() else ao.sort_order::float8 end) as opts
        from public.answer_options ao
        where ao.question_id = any (v_order)
        group by ao.question_id) t;

  insert into public.exam_attempts (exam_id, student_id, attempt_no, expires_at, question_order, option_order)
  values (p_exam, v_me, v_count + 1, now() + make_interval(mins => e.duration_minutes), v_order, v_opts)
  returning id into v_id;

  perform private.touch_streak(v_me);
  perform private.log_activity('exam.started', 'exam_attempt', v_id, jsonb_build_object('exam_id', p_exam));
  return v_id;
end $$;

create or replace function public.get_attempt(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.exam_attempts; e public.examinations; v_practice boolean;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid();
  if not found then raise exception 'Attempt not found.'; end if;
  if a.status = 'in_progress' and a.expires_at <= now() then
    perform private.grade_attempt(a.id);
    select * into a from public.exam_attempts where id = p_attempt;
  end if;
  select * into e from public.examinations where id = a.exam_id;
  v_practice := e.exam_type = 'practice';

  return jsonb_build_object(
    'attempt', jsonb_build_object('id', a.id, 'status', a.status, 'started_at', a.started_at,
                                  'expires_at', a.expires_at, 'attempt_no', a.attempt_no),
    'server_now', now(),
    'exam', jsonb_build_object('id', e.id, 'title', e.title, 'instructions', e.instructions,
                               'exam_type', e.exam_type, 'exam_body', e.exam_body,
                               'duration_minutes', e.duration_minutes,
                               'subject', (select name from public.subjects where id = e.subject_id)),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', q.id, 'type', q.question_type, 'body', q.body, 'image_path', q.image_path,
               'topic', q.topic, 'marks', coalesce(eq.marks, q.marks),
               'options', coalesce((
                  select jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body) order by oo.ord)
                  from jsonb_array_elements_text(coalesce(a.option_order -> (q.id::text), '[]')) with ordinality as oo(opt_id, ord)
                  join public.answer_options o on o.id = oo.opt_id::uuid), '[]'::jsonb))
             order by u.ord)
      from unnest(a.question_order) with ordinality as u(qid, ord)
      join public.questions q on q.id = u.qid
      left join public.exam_questions eq on eq.exam_id = a.exam_id and eq.question_id = q.id), '[]'::jsonb),
    'answers', coalesce((
      select jsonb_object_agg(sa.question_id, jsonb_build_object(
               'selected_option_id', sa.selected_option_id, 'text_answer', sa.text_answer,
               'is_correct', case when v_practice then sa.is_correct end,
               'correct_option_ids', case when v_practice and sa.is_correct is not null then k.correct_option_ids end,
               'explanation', case when v_practice and sa.is_correct is not null then k.explanation end))
      from public.student_answers sa
      left join public.question_answer_keys k on k.question_id = sa.question_id
      where sa.attempt_id = a.id), '{}'::jsonb)
  );
end $$;

create or replace function public.save_answer(p_attempt uuid, p_question uuid, p_option uuid default null, p_text text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.exam_attempts; e public.examinations; q public.questions; k public.question_answer_keys;
  v_prev public.student_answers; v_correct boolean;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid() for update;
  if not found then raise exception 'Attempt not found.'; end if;
  if a.status <> 'in_progress' then raise exception 'This attempt has already been submitted.'; end if;
  if now() > a.expires_at + interval '20 seconds' then
    perform private.grade_attempt(a.id);
    return jsonb_build_object('saved', false, 'expired', true);
  end if;
  if not (p_question = any (a.question_order)) then raise exception 'That question is not part of this attempt.'; end if;
  select * into q from public.questions where id = p_question;
  if p_option is not null and not exists (select 1 from public.answer_options where id = p_option and question_id = p_question) then
    raise exception 'That option does not belong to this question.';
  end if;
  select * into e from public.examinations where id = a.exam_id;

  if e.exam_type = 'practice' then
    select * into v_prev from public.student_answers where attempt_id = a.id and question_id = p_question;
    if found and v_prev.is_correct is not null then
      raise exception 'You already checked this answer.';
    end if;
  end if;

  insert into public.student_answers (attempt_id, question_id, selected_option_id, text_answer, answered_at)
  values (a.id, p_question, p_option, left(p_text, 10000), now())
  on conflict (attempt_id, question_id) do update
    set selected_option_id = excluded.selected_option_id, text_answer = excluded.text_answer, answered_at = now();

  if e.exam_type = 'practice' and q.question_type in ('mcq', 'true_false') and p_option is not null then
    select * into k from public.question_answer_keys where question_id = p_question;
    v_correct := p_option = any (coalesce(k.correct_option_ids, '{}'));
    update public.student_answers
       set is_correct = v_correct, awarded_marks = case when v_correct then q.marks else 0 end
     where attempt_id = a.id and question_id = p_question;
    return jsonb_build_object('saved', true, 'is_correct', v_correct,
                              'correct_option_ids', k.correct_option_ids, 'explanation', k.explanation);
  end if;
  return jsonb_build_object('saved', true);
end $$;

create or replace function public.submit_exam_attempt(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.exam_attempts; e public.examinations; r public.results;
begin
  select * into a from public.exam_attempts where id = p_attempt and student_id = auth.uid();
  if not found then raise exception 'Attempt not found.'; end if;
  if a.status = 'in_progress' then
    perform private.grade_attempt(a.id);
    perform private.log_activity('exam.submitted', 'exam_attempt', a.id);
  end if;
  select * into a from public.exam_attempts where id = p_attempt;
  select * into e from public.examinations where id = a.exam_id;
  if not e.show_results_immediately and e.owner_student_id is null then
    return jsonb_build_object('status', a.status, 'show_results', false);
  end if;
  select * into r from public.results where attempt_id = a.id;
  return jsonb_build_object('status', a.status, 'show_results', true, 'needs_manual_grading', a.needs_manual_grading,
    'score', a.score, 'max_score', a.max_score, 'percentage', a.percentage, 'grade', r.grade, 'passed', r.passed);
end $$;

create or replace function public.get_attempt_review(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.exam_attempts; e public.examinations;
  v_is_owner boolean; v_staff boolean; v_reveal boolean;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  if not found then raise exception 'Attempt not found.'; end if;
  select * into e from public.examinations where id = a.exam_id;
  v_is_owner := a.student_id = auth.uid();
  v_staff := public.can_edit_exam(e.id) or (e.classroom_id is not null and public.is_classroom_teacher(e.classroom_id)) or public.is_admin();
  if not (v_is_owner or v_staff or public.is_parent_of(a.student_id)) then
    raise exception 'Not allowed.';
  end if;
  if a.status = 'in_progress' then raise exception 'This attempt is still in progress.'; end if;
  if not v_staff and not e.show_results_immediately and e.owner_student_id is null and a.status <> 'graded' then
    raise exception 'Results for this examination have not been released yet.';
  end if;
  v_reveal := v_staff or e.show_explanations or e.exam_type in ('practice', 'mock') or e.owner_student_id is not null;

  return jsonb_build_object(
    'exam', jsonb_build_object('id', e.id, 'title', e.title, 'exam_type', e.exam_type, 'exam_body', e.exam_body,
                               'pass_mark', e.pass_mark, 'subject', (select name from public.subjects where id = e.subject_id)),
    'attempt', jsonb_build_object('id', a.id, 'status', a.status, 'score', a.score, 'max_score', a.max_score,
                                  'percentage', a.percentage, 'submitted_at', a.submitted_at, 'started_at', a.started_at,
                                  'needs_manual_grading', a.needs_manual_grading,
                                  'student_name', (select full_name from public.profiles where id = a.student_id),
                                  'grade', (select grade from public.results where attempt_id = a.id)),
    'can_grade', v_staff,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', q.id, 'type', q.question_type, 'body', q.body, 'image_path', q.image_path, 'topic', q.topic,
               'marks', coalesce(eq.marks, q.marks),
               'options', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body,
                                       'is_correct', case when v_reveal then o.id = any (coalesce(k.correct_option_ids, '{}')) end)
                                     order by o.sort_order)
                                    from public.answer_options o where o.question_id = q.id), '[]'::jsonb),
               'selected_option_id', sa.selected_option_id, 'text_answer', sa.text_answer,
               'is_correct', sa.is_correct, 'awarded_marks', sa.awarded_marks, 'feedback', sa.feedback,
               'accepted_answers', case when v_reveal then k.accepted_answers end,
               'explanation', case when v_reveal then k.explanation end)
             order by u.ord)
      from unnest(a.question_order) with ordinality as u(qid, ord)
      join public.questions q on q.id = u.qid
      left join public.exam_questions eq on eq.exam_id = a.exam_id and eq.question_id = q.id
      left join public.student_answers sa on sa.attempt_id = a.id and sa.question_id = q.id
      left join public.question_answer_keys k on k.question_id = q.id), '[]'::jsonb)
  );
end $$;

create or replace function public.grade_answer(p_attempt uuid, p_question uuid, p_marks numeric, p_feedback text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.exam_attempts; e public.examinations; v_max numeric;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  if not found then raise exception 'Attempt not found.'; end if;
  select * into e from public.examinations where id = a.exam_id;
  if not (public.can_edit_exam(e.id) or (e.classroom_id is not null and public.is_classroom_teacher(e.classroom_id))) then
    raise exception 'Only the examination owner can grade answers.';
  end if;
  if a.status = 'in_progress' then raise exception 'This attempt is still in progress.'; end if;
  select coalesce(eq.marks, q.marks) into v_max
  from public.questions q left join public.exam_questions eq on eq.exam_id = a.exam_id and eq.question_id = q.id
  where q.id = p_question and p_question = any (a.question_order);
  if v_max is null then raise exception 'That question is not part of this attempt.'; end if;
  if p_marks is null or p_marks < 0 or p_marks > v_max then
    raise exception 'Marks must be between 0 and %.', v_max;
  end if;
  insert into public.student_answers (attempt_id, question_id, awarded_marks, is_correct, feedback, graded_by)
  values (a.id, p_question, p_marks, p_marks >= v_max, left(p_feedback, 4000), auth.uid())
  on conflict (attempt_id, question_id) do update
    set awarded_marks = excluded.awarded_marks, is_correct = excluded.is_correct,
        feedback = excluded.feedback, graded_by = excluded.graded_by;
  perform private.finalize_attempt(a.id);
  perform private.log_activity('exam.answer_graded', 'exam_attempt', a.id, jsonb_build_object('question_id', p_question, 'marks', p_marks));
  return (select jsonb_build_object('status', status, 'score', score, 'percentage', percentage)
          from public.exam_attempts where id = a.id);
end $$;

-- CBT Centre: build a personal practice or mock session from shared banks.
create or replace function public.create_practice_session(
  p_subject uuid, p_exam_body text default null, p_topic text default null,
  p_count int default 20, p_minutes int default 20, p_mode text default 'practice')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_exam uuid;
  v_subject text;
  v_n int;
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'Only student accounts can start a practice session.';
  end if;
  if p_mode not in ('practice', 'mock') then raise exception 'Mode must be practice or mock.'; end if;
  select name into v_subject from public.subjects where id = p_subject;
  if v_subject is null then raise exception 'Choose a subject.'; end if;

  insert into public.examinations (title, exam_type, exam_body, subject_id, owner_student_id, duration_minutes,
                                   randomize_questions, randomize_options, show_results_immediately, show_explanations,
                                   max_attempts, is_published, instructions)
  values (
    case when p_mode = 'mock' then 'Mock: ' else 'Practice: ' end || coalesce(p_exam_body || ' ', '') || v_subject
      || coalesce(' — ' || nullif(trim(p_topic), ''), ''),
    p_mode, p_exam_body, p_subject, v_me, greatest(1, least(coalesce(p_minutes, 20), 180)),
    true, true, true, true, 1, false,
    case when p_mode = 'mock'
         then 'Timed mock: answers are marked when you submit or when time runs out.'
         else 'Practice mode: check each answer as you go and read the explanation.' end)
  returning id into v_exam;

  insert into public.exam_questions (exam_id, question_id, sort_order)
  select v_exam, x.id, row_number() over ()
  from (select q.id from public.questions q
        join public.question_banks b on b.id = q.bank_id and b.is_shared
        where q.subject_id = p_subject
          and q.question_type in ('mcq', 'true_false')
          and (p_exam_body is null or q.exam_body = p_exam_body or b.exam_body = p_exam_body)
          and (nullif(trim(p_topic), '') is null or q.topic ilike '%' || trim(p_topic) || '%')
          and exists (select 1 from public.question_answer_keys k where k.question_id = q.id and cardinality(k.correct_option_ids) > 0)
        order by random()
        limit greatest(1, least(coalesce(p_count, 20), 60))) x;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    delete from public.examinations where id = v_exam;
    raise exception 'No practice questions are available for % yet.', v_subject;
  end if;

  return public.start_exam_attempt(v_exam);
end $$;

-- Teachers save a question, its options and its answer key in one step.
create or replace function public.upsert_question(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_type text := coalesce(p ->> 'question_type', 'mcq');
  v_opt jsonb;
  v_opt_id uuid;
  v_keep uuid[] := '{}';
  v_correct uuid[] := '{}';
  v_i int := 0;
begin
  if not public.is_active_teacher() then raise exception 'Only approved teachers can write questions.'; end if;
  if coalesce(trim(p ->> 'body'), '') = '' then raise exception 'Write the question text.'; end if;
  if v_type not in ('mcq', 'true_false', 'short_answer', 'essay') then raise exception 'Unknown question type.'; end if;
  if nullif(p ->> 'bank_id', '') is not null and not exists (
       select 1 from public.question_banks where id = (p ->> 'bank_id')::uuid and (owner_id = auth.uid() or public.is_admin())) then
    raise exception 'You can only add questions to your own question banks.';
  end if;

  if v_id is null then
    insert into public.questions (bank_id, subject_id, class_id, topic, question_type, body, marks, difficulty, exam_body, created_by, source_license)
    values (nullif(p ->> 'bank_id', '')::uuid, nullif(p ->> 'subject_id', '')::uuid, nullif(p ->> 'class_id', '')::uuid,
            nullif(trim(p ->> 'topic'), ''), v_type, trim(p ->> 'body'), coalesce(nullif(p ->> 'marks', '')::numeric, 1),
            coalesce(p ->> 'difficulty', 'medium'), nullif(p ->> 'exam_body', ''), auth.uid(),
            coalesce(nullif(p ->> 'source_license', ''), 'Original content'))
    returning id into v_id;
  else
    if not public.can_edit_question(v_id) then raise exception 'You can only edit your own questions.'; end if;
    update public.questions
       set subject_id = nullif(p ->> 'subject_id', '')::uuid, class_id = nullif(p ->> 'class_id', '')::uuid,
           topic = nullif(trim(p ->> 'topic'), ''), question_type = v_type, body = trim(p ->> 'body'),
           marks = coalesce(nullif(p ->> 'marks', '')::numeric, marks), difficulty = coalesce(p ->> 'difficulty', difficulty),
           exam_body = nullif(p ->> 'exam_body', '')
     where id = v_id;
  end if;

  if v_type in ('mcq', 'true_false') then
    if jsonb_typeof(p -> 'options') <> 'array' or jsonb_array_length(p -> 'options') < 2 then
      raise exception 'Add at least two options.';
    end if;
    for v_opt in select * from jsonb_array_elements(p -> 'options') loop
      v_i := v_i + 1;
      v_opt_id := nullif(v_opt ->> 'id', '')::uuid;
      if v_opt_id is not null and exists (select 1 from public.answer_options where id = v_opt_id and question_id = v_id) then
        update public.answer_options set body = trim(v_opt ->> 'body'), sort_order = v_i where id = v_opt_id;
      else
        insert into public.answer_options (question_id, body, sort_order) values (v_id, trim(v_opt ->> 'body'), v_i)
        returning id into v_opt_id;
      end if;
      v_keep := v_keep || v_opt_id;
      if coalesce((v_opt ->> 'is_correct')::boolean, false) then v_correct := v_correct || v_opt_id; end if;
    end loop;
    if cardinality(v_correct) = 0 then raise exception 'Mark the correct option.'; end if;
    delete from public.answer_options where question_id = v_id and not (id = any (v_keep));
  else
    delete from public.answer_options where question_id = v_id;
  end if;

  insert into public.question_answer_keys (question_id, correct_option_ids, accepted_answers, explanation)
  values (v_id, v_correct,
          case when jsonb_typeof(p -> 'accepted_answers') = 'array'
               then array(select trim(x) from jsonb_array_elements_text(p -> 'accepted_answers') x where trim(x) <> '')
               else '{}' end,
          nullif(trim(p ->> 'explanation'), ''))
  on conflict (question_id) do update
    set correct_option_ids = excluded.correct_option_ids, accepted_answers = excluded.accepted_answers,
        explanation = excluded.explanation;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- AI companion: usage is logged against the student and rate-limited.
-- ---------------------------------------------------------------------
create or replace function public.ai_log_message(p_role text, p_content text, p_subject uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare v_used int; v_limit int;
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'The learning companion is for student accounts.';
  end if;
  if p_role not in ('user', 'assistant') then raise exception 'Invalid role.'; end if;
  v_limit := coalesce((select (value)::text::int from public.platform_settings where key = 'ai_daily_limit'), 40);
  select count(*) into v_used from public.ai_messages
  where student_id = auth.uid() and role = 'user' and created_at > now() - interval '24 hours';
  if p_role = 'user' and v_used >= v_limit then
    raise exception 'You have used today''s % questions. The companion resets in 24 hours.', v_limit;
  end if;
  insert into public.ai_messages (student_id, role, content, subject_id)
  values (auth.uid(), p_role, left(p_content, 8000), p_subject);
  return v_limit - v_used - case when p_role = 'user' then 1 else 0 end;
end $$;

-- ---------------------------------------------------------------------
-- Administration (every call is checked and logged)
-- ---------------------------------------------------------------------
create or replace function public.admin_review_teacher(p_teacher uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  update public.teachers
     set application_status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(p_note, 1000)
   where profile_id = p_teacher;
  if not found then raise exception 'Teacher application not found.'; end if;
  update public.profiles set status = case when p_approve then 'active' else 'pending' end where id = p_teacher;
  perform private.notify(p_teacher,
    case when p_approve then 'Your teacher account is approved' else 'Update on your teacher application' end,
    case when p_approve then 'You can now create classrooms, courses and examinations.'
         else coalesce(p_note, 'Your application was not approved. Contact support for details.') end,
    '/teacher', 'account');
  perform private.log_activity(case when p_approve then 'teacher.approved' else 'teacher.rejected' end, 'profile', p_teacher,
                               jsonb_build_object('note', p_note));
end $$;

create or replace function public.admin_set_user_status(p_user uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  if p_status not in ('active', 'pending', 'suspended') then raise exception 'Unknown status.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own status.'; end if;
  update public.profiles set status = p_status where id = p_user;
  perform private.log_activity('user.status_changed', 'profile', p_user, jsonb_build_object('status', p_status));
end $$;

create or replace function public.admin_set_user_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  if not exists (select 1 from public.roles where key = p_role) then raise exception 'Unknown role.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role.'; end if;
  update public.profiles set role = p_role where id = p_user;
  if p_role = 'student' then insert into public.students (profile_id) values (p_user) on conflict do nothing;
  elsif p_role = 'teacher' then
    insert into public.teachers (profile_id, application_status, reviewed_by, reviewed_at)
    values (p_user, 'approved', auth.uid(), now()) on conflict do nothing;
  elsif p_role = 'parent' then insert into public.parents (profile_id) values (p_user) on conflict do nothing;
  end if;
  perform private.log_activity('user.role_changed', 'profile', p_user, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_list_users(p_role text default null, p_search text default null, p_limit int default 50, p_offset int default 0)
returns table (id uuid, full_name text, email text, role text, status text, created_at timestamptz, last_sign_in_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  return query
    select p.id, p.full_name, u.email::text, p.role, p.status, p.created_at, u.last_sign_in_at, count(*) over ()
    from public.profiles p join auth.users u on u.id = p.id
    where (p_role is null or p.role = p_role)
      and (p_search is null or p.full_name ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%')
    order by p.created_at desc
    limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
end $$;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  select jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'teachers_active', (select count(*) from public.profiles where role = 'teacher' and status = 'active'),
    'teachers_pending', (select count(*) from public.teachers where application_status = 'pending'),
    'parents', (select count(*) from public.profiles where role = 'parent'),
    'classrooms', (select count(*) from public.classrooms where not is_archived),
    'courses', (select count(*) from public.courses),
    'courses_published', (select count(*) from public.courses where is_published),
    'examinations', (select count(*) from public.examinations where owner_student_id is null),
    'exam_attempts', (select count(*) from public.exam_attempts),
    'assignments', (select count(*) from public.assignments),
    'submissions', (select count(*) from public.assignment_submissions),
    'expected_submissions', (select count(*) from public.assignments a
                             join public.enrollments e on e.classroom_id = a.classroom_id and e.status = 'active'
                             where a.is_published and a.due_at < now()),
    'active_learners_7d', (select count(distinct student_id) from public.points_ledger where created_at > now() - interval '7 days'),
    'revenue_kobo', (select coalesce(sum(amount_kobo), 0) from public.payments where status = 'success'),
    'active_subscriptions', (select count(*) from public.subscriptions where status = 'active'),
    'open_reports', (select count(*) from public.reports where status in ('open', 'reviewing')),
    'signups_14d', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count',
                       (select count(*) from public.profiles p where (p.created_at at time zone 'Africa/Lagos')::date = d::date))
                       order by d), '[]'::jsonb)
                    from generate_series((now() at time zone 'Africa/Lagos')::date - 13, (now() at time zone 'Africa/Lagos')::date, interval '1 day') d)
  ) into v;
  return v;
end $$;

create or replace function public.admin_broadcast(p_role text, p_title text, p_body text, p_link text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  insert into public.notifications (user_id, title, body, link, category)
  select id, left(p_title, 200), left(p_body, 2000), p_link, 'broadcast'
  from public.profiles where status = 'active' and (p_role is null or role = p_role);
  get diagnostics v_n = row_count;
  perform private.log_activity('notification.broadcast', null, null, jsonb_build_object('role', p_role, 'title', p_title, 'recipients', v_n));
  return v_n;
end $$;

-- ---------------------------------------------------------------------
-- Payments: only the server (service role) may confirm a payment, and
-- only after the provider has verified it.
-- ---------------------------------------------------------------------
create or replace function public.service_confirm_payment(p_reference text, p_amount_kobo bigint, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare pay public.payments; v_plan public.subscription_plans; v_sub uuid; v_end timestamptz; v_start timestamptz;
begin
  select * into pay from public.payments where reference = p_reference for update;
  if not found then raise exception 'Unknown payment reference.'; end if;
  if pay.status = 'success' then
    return jsonb_build_object('status', 'success', 'already_confirmed', true, 'subscription_id', pay.subscription_id);
  end if;
  if p_amount_kobo < pay.amount_kobo then
    update public.payments set status = 'failed', provider_payload = p_payload where id = pay.id;
    raise exception 'Amount paid (%) is less than expected (%).', p_amount_kobo, pay.amount_kobo;
  end if;
  select * into v_plan from public.subscription_plans where id = pay.plan_id;

  select greatest(now(), coalesce(max(ends_at), now())) into v_start from public.subscriptions
  where user_id = pay.user_id and plan_id = pay.plan_id and status = 'active';
  v_end := v_start + case v_plan.billing_interval when 'month' then interval '1 month' when 'term' then interval '4 months'
                                                 when 'year' then interval '1 year' else interval '100 years' end;
  insert into public.subscriptions (user_id, plan_id, status, starts_at, ends_at)
  values (pay.user_id, pay.plan_id, 'active', now(), v_end) returning id into v_sub;

  update public.payments set status = 'success', verified_at = now(), provider_payload = p_payload, subscription_id = v_sub
  where id = pay.id;
  insert into public.notifications (user_id, title, body, link, category)
  values (pay.user_id, 'Payment confirmed', v_plan.name || ' is active until ' || to_char(v_end at time zone 'Africa/Lagos', 'DD Mon YYYY') || '.', '/billing', 'payment');
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (pay.user_id, 'payment.confirmed', 'payment', pay.id, jsonb_build_object('reference', p_reference, 'amount_kobo', p_amount_kobo));
  return jsonb_build_object('status', 'success', 'subscription_id', v_sub, 'ends_at', v_end);
end $$;

-- Function privileges: signed-in users may call the RPCs (each checks its
-- own permissions); signed-out visitors may only verify certificates;
-- payment confirmation is reserved for the server.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.service_confirm_payment(text, bigint, jsonb) from authenticated;
grant execute on function public.verify_certificate(text) to anon;

-- Supabase Auth inserts users as supabase_auth_admin; let it fire the sign-up trigger.
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

-- ---------------------------------------------------------------------
-- CBT Centre catalogue: which subjects and topics have practice questions.
-- ---------------------------------------------------------------------
create or replace function public.cbt_catalogue()
returns table (exam_body text, subject_id uuid, subject_name text, topic text, question_count bigint)
language sql stable security definer set search_path = '' as $$
  select coalesce(q.exam_body, b.exam_body) as exam_body, q.subject_id, s.name, coalesce(q.topic, 'General'), count(*)
  from public.questions q
  join public.question_banks b on b.id = q.bank_id and b.is_shared
  join public.subjects s on s.id = q.subject_id
  where q.question_type in ('mcq', 'true_false')
    and exists (select 1 from public.question_answer_keys k where k.question_id = q.id and cardinality(k.correct_option_ids) > 0)
    and auth.uid() is not null
  group by 1, 2, 3, 4
  order by 3, 4
$$;
revoke execute on function public.cbt_catalogue() from public, anon;
grant execute on function public.cbt_catalogue() to authenticated;

-- Counts downloads of library and course materials the user can see.
create or replace function public.touch_material_download(p_path text)
returns void language sql security definer set search_path = '' as $$
  update public.learning_materials set download_count = download_count + 1
  where storage_path = p_path and public.can_view_material(id);
$$;
revoke execute on function public.touch_material_download(text) from public, anon;
grant execute on function public.touch_material_download(text) to authenticated;

-- Notify the other participant when a parent or teacher sends a message.
create or replace function private.on_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t public.message_threads; v_to uuid; v_link text;
begin
  select * into t from public.message_threads where id = new.thread_id;
  update public.message_threads set updated_at = now() where id = new.thread_id;
  v_to := case when new.sender_id = t.parent_id then t.teacher_id else t.parent_id end;
  v_link := case when new.sender_id = t.parent_id then '/teacher/messages?t=' else '/parent/messages?t=' end || t.id;
  perform private.notify(v_to, 'New message: ' || t.subject, left(new.body, 140), v_link, 'message');
  return new;
end $$;

create trigger notify_message after insert on public.messages
  for each row execute function private.on_message();

-- Public course catalogue for the landing page. Visitors see titles, summaries and
-- lesson counts, but never lesson content, which stays behind sign-in.
create or replace function public.catalogue_courses(p_limit int default 6)
returns table (id uuid, title text, slug text, summary text, difficulty text,
               subject_name text, subject_color text, class_name text, lesson_count int)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.slug, c.summary, c.difficulty, s.name, s.color, k.name,
         (select count(*)::int from public.lessons l where l.course_id = c.id and l.is_published)
  from public.courses c
  left join public.subjects s on s.id = c.subject_id
  left join public.classes k on k.id = c.class_id
  where c.is_published and c.classroom_id is null
  order by c.is_featured desc, c.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 24)
$$;
revoke all on function public.catalogue_courses(int) from public;
grant execute on function public.catalogue_courses(int) to anon, authenticated, service_role;

-- Free downloads shown on the public Resources page: approved library items marked for the public.
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
  order by m.library_category, k.sort_order nulls last, m.title
$$;
revoke all on function public.public_resources() from public;
grant execute on function public.public_resources() to anon, authenticated, service_role;

-- Count opens of free downloads too (they are not in storage, so the storage counter never sees them).
create or replace function public.touch_public_resource(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.learning_materials set download_count = download_count + 1
  where id = p_id and audience = 'public' and is_approved;
$$;
revoke all on function public.touch_public_resource(uuid) from public;
grant execute on function public.touch_public_resource(uuid) to anon, authenticated, service_role;
-- The builder's view: how many students, teachers and classrooms each class has.
create or replace function public.admin_class_breakdown()
returns table (code text, name text, level_name text, sort_order int, students bigint, active_7d bigint,
               teachers bigint, classrooms bigint, courses bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrators only.'; end if;
  return query
  select k.code, k.name, l.name, k.sort_order,
    (select count(*) from public.students s join public.profiles p on p.id = s.profile_id
      where s.class_id = k.id and p.status <> 'suspended'),
    (select count(distinct s.profile_id) from public.students s
      where s.class_id = k.id and (
        exists (select 1 from public.lesson_progress lp where lp.student_id = s.profile_id and lp.updated_at > now() - interval '7 days')
        or exists (select 1 from public.exam_attempts a where a.student_id = s.profile_id and a.started_at > now() - interval '7 days')
        or s.last_active_on >= ((now() at time zone 'Africa/Lagos')::date - 7))),
    (select count(distinct tc.teacher_id) from public.teacher_classes tc
      join public.teachers t on t.profile_id = tc.teacher_id and t.application_status = 'approved'
      where tc.class_id = k.id),
    (select count(*) from public.classrooms c where c.class_id = k.id and not c.is_archived),
    (select count(*) from public.courses c where c.class_id = k.id and c.is_published)
  from public.classes k
  left join public.education_levels l on l.id = k.level_id
  where k.is_active
  order by k.sort_order;
end $$;
revoke all on function public.admin_class_breakdown() from public, anon;
grant execute on function public.admin_class_breakdown() to authenticated, service_role;
