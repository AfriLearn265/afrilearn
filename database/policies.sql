-- =====================================================================
-- AfriLearn — table privileges, Row Level Security and storage rules
-- Permissions are enforced in the database: changing a URL or editing
-- browser data can never grant access the policies below do not allow.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------
-- Signed-out visitors can only read the public catalogue.
revoke all on all tables in schema public from anon;
grant select on public.roles, public.education_levels, public.classes, public.subjects, public.class_subjects,
  public.subscription_plans, public.testimonials, public.badges, public.platform_settings, public.courses
  to anon;

-- Tables written only by server-side functions (RPCs) or the service role.
revoke insert, update, delete on
  public.profiles, public.students, public.teachers, public.parents, public.parent_children,
  public.enrollments, public.lesson_progress, public.assignment_submissions, public.exam_attempts,
  public.student_answers, public.results, public.certificates, public.student_badges, public.points_ledger,
  public.subscriptions, public.payments, public.activity_logs, public.ai_messages, public.notifications,
  public.message_threads, public.messages, public.reports
from authenticated;

-- Column-level edits users may make to their own records.
grant update (full_name, avatar_url, last_seen_at) on public.profiles to authenticated;
grant update (class_id, interests, leaderboard_opt_in, guardian_name, guardian_email) on public.students to authenticated;
grant update (phone, qualification, institution, years_experience, bio, document_paths) on public.teachers to authenticated;
grant update (phone) on public.parents to authenticated;
grant delete on public.parent_children to authenticated;
grant update (status) on public.enrollments to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
grant insert on public.certificates to authenticated;
grant insert on public.message_threads to authenticated;
grant update (status) on public.message_threads to authenticated;
grant insert on public.messages to authenticated;
grant update (is_flagged) on public.messages to authenticated;
grant delete on public.messages to authenticated;
grant insert on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Reference data: everyone reads, administrators write
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['roles', 'education_levels', 'classes', 'subjects', 'class_subjects', 'badges'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select to anon, authenticated using (true)', t);
    execute format('create policy "%1$s: admin insert" on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
  foreach t in array array['weekly_challenges'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "%1$s: admin insert" on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

create policy "subscription_plans: public read" on public.subscription_plans for select to anon using (is_active);
create policy "subscription_plans: read" on public.subscription_plans for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "subscription_plans: admin insert" on public.subscription_plans for insert to authenticated with check ((select public.is_admin()));
create policy "subscription_plans: admin update" on public.subscription_plans for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "subscription_plans: admin delete" on public.subscription_plans for delete to authenticated using ((select public.is_admin()));

create policy "testimonials: public read" on public.testimonials for select to anon using (is_published);
create policy "testimonials: read" on public.testimonials for select to authenticated
  using (is_published or (select public.is_admin()));
create policy "testimonials: admin insert" on public.testimonials for insert to authenticated with check ((select public.is_admin()));
create policy "testimonials: admin update" on public.testimonials for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "testimonials: admin delete" on public.testimonials for delete to authenticated using ((select public.is_admin()));

create policy "platform_settings: public read" on public.platform_settings for select to anon using (is_public);
create policy "platform_settings: read" on public.platform_settings for select to authenticated
  using (is_public or (select public.is_admin()));
create policy "platform_settings: admin insert" on public.platform_settings for insert to authenticated with check ((select public.is_admin()));
create policy "platform_settings: admin update" on public.platform_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "platform_settings: admin delete" on public.platform_settings for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create policy "profiles: read" on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or (select public.is_admin())
  or role in ('teacher', 'admin')
  or public.teaches_student(id)
  or public.is_parent_of(id)
  or (role = 'parent' and exists (select 1 from public.parent_children pc
        where pc.parent_id = profiles.id and (pc.student_id = (select auth.uid()) or public.teaches_student(pc.student_id))))
);
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "students: read" on public.students for select to authenticated using (
  profile_id = (select auth.uid()) or (select public.is_admin())
  or public.teaches_student(profile_id) or public.is_parent_of(profile_id));
create policy "students: update own" on public.students for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "teachers: read" on public.teachers for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "teachers: update own" on public.teachers for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "teacher_subjects: read" on public.teacher_subjects for select to authenticated using (true);
create policy "teacher_subjects: insert" on public.teacher_subjects for insert to authenticated
  with check (teacher_id = (select auth.uid()) or (select public.is_admin()));
create policy "teacher_subjects: delete" on public.teacher_subjects for delete to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()));
create policy "teacher_classes: read" on public.teacher_classes for select to authenticated using (true);
create policy "teacher_classes: insert" on public.teacher_classes for insert to authenticated
  with check (teacher_id = (select auth.uid()) or (select public.is_admin()));
create policy "teacher_classes: delete" on public.teacher_classes for delete to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()));

create policy "parents: read" on public.parents for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "parents: update own" on public.parents for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "parent_children: read" on public.parent_children for select to authenticated using (
  parent_id = (select auth.uid()) or student_id = (select auth.uid())
  or (select public.is_admin()) or public.teaches_student(student_id));
create policy "parent_children: unlink" on public.parent_children for delete to authenticated
  using (parent_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Classrooms and learning content
-- ---------------------------------------------------------------------
create policy "classrooms: read" on public.classrooms for select to authenticated using (
  teacher_id = (select auth.uid()) or (select public.is_admin())
  or public.is_classroom_member(id) or public.parent_has_child_in(id));
create policy "classrooms: create" on public.classrooms for insert to authenticated
  with check ((select public.is_active_teacher()) and teacher_id = (select auth.uid()));
create policy "classrooms: update" on public.classrooms for update to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()))
  with check (teacher_id = (select auth.uid()) or (select public.is_admin()));
create policy "classrooms: delete" on public.classrooms for delete to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()));

create policy "enrollments: read" on public.enrollments for select to authenticated using (
  student_id = (select auth.uid()) or (select public.is_admin())
  or public.is_classroom_teacher(classroom_id) or public.is_parent_of(student_id));
create policy "enrollments: teacher update" on public.enrollments for update to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()))
  with check (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));

create policy "courses: public catalogue" on public.courses for select to anon
  using (is_published and classroom_id is null);
create policy "courses: read" on public.courses for select to authenticated using (public.can_view_course(id));
create policy "courses: create" on public.courses for insert to authenticated with check (
  (select public.is_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid())
      and (classroom_id is null or public.is_classroom_teacher(classroom_id))));
create policy "courses: update" on public.courses for update to authenticated
  using (public.can_edit_course(id))
  with check ((select public.is_admin()) or (teacher_id = (select auth.uid())
              and (classroom_id is null or public.is_classroom_teacher(classroom_id))));
create policy "courses: delete" on public.courses for delete to authenticated using (public.can_edit_course(id));

create policy "topics: read" on public.topics for select to authenticated using (public.can_view_course(course_id));
create policy "topics: insert" on public.topics for insert to authenticated with check (public.can_edit_course(course_id));
create policy "topics: update" on public.topics for update to authenticated
  using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));
create policy "topics: delete" on public.topics for delete to authenticated using (public.can_edit_course(course_id));

create policy "lessons: read" on public.lessons for select to authenticated
  using ((is_published and public.can_view_course(course_id)) or public.can_edit_course(course_id));
create policy "lessons: insert" on public.lessons for insert to authenticated with check (public.can_edit_course(course_id));
create policy "lessons: update" on public.lessons for update to authenticated
  using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));
create policy "lessons: delete" on public.lessons for delete to authenticated using (public.can_edit_course(course_id));

create policy "learning_materials: read" on public.learning_materials for select to authenticated
  using (public.can_view_material(id));
create policy "learning_materials: upload" on public.learning_materials for insert to authenticated with check (
  (select public.is_admin())
  or ((select public.is_active_teacher()) and uploaded_by = (select auth.uid())
      and (course_id is null or public.can_edit_course(course_id))
      and (classroom_id is null or public.is_classroom_teacher(classroom_id))));
create policy "learning_materials: update" on public.learning_materials for update to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()))
  with check (uploaded_by = (select auth.uid()) or (select public.is_admin()));
create policy "learning_materials: delete" on public.learning_materials for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()));

create policy "lesson_progress: read" on public.lesson_progress for select to authenticated using (
  student_id = (select auth.uid()) or (select public.is_admin())
  or public.teaches_student(student_id) or public.is_parent_of(student_id));

-- ---------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------
create policy "assignments: read" on public.assignments for select to authenticated using (
  public.is_classroom_teacher(classroom_id) or (select public.is_admin())
  or (is_published and (public.is_classroom_member(classroom_id) or public.parent_has_child_in(classroom_id))));
create policy "assignments: create" on public.assignments for insert to authenticated with check (
  (select public.is_active_teacher()) and teacher_id = (select auth.uid()) and public.is_classroom_teacher(classroom_id));
create policy "assignments: update" on public.assignments for update to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()))
  with check (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));
create policy "assignments: delete" on public.assignments for delete to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));

create policy "assignment_submissions: read" on public.assignment_submissions for select to authenticated using (
  student_id = (select auth.uid()) or (select public.is_admin()) or public.is_parent_of(student_id)
  or exists (select 1 from public.assignments a where a.id = assignment_id and public.is_classroom_teacher(a.classroom_id)));

-- ---------------------------------------------------------------------
-- Question banks and examinations (students never read questions or
-- answer keys directly: they receive them through exam RPCs)
-- ---------------------------------------------------------------------
create policy "question_banks: read" on public.question_banks for select to authenticated using (
  owner_id = (select auth.uid()) or (select public.is_admin()) or (is_shared and (select public.is_active_teacher())));
create policy "question_banks: create" on public.question_banks for insert to authenticated
  with check ((select public.is_active_teacher()) and owner_id = (select auth.uid()));
create policy "question_banks: update" on public.question_banks for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "question_banks: delete" on public.question_banks for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "questions: read" on public.questions for select to authenticated using (public.can_view_question(id));
create policy "questions: create" on public.questions for insert to authenticated with check (
  (select public.is_active_teacher()) and created_by = (select auth.uid())
  and (bank_id is null or exists (select 1 from public.question_banks b where b.id = bank_id
                                  and (b.owner_id = (select auth.uid()) or (select public.is_admin())))));
create policy "questions: update" on public.questions for update to authenticated
  using (public.can_edit_question(id)) with check (public.can_edit_question(id));
create policy "questions: delete" on public.questions for delete to authenticated using (public.can_edit_question(id));

create policy "answer_options: read" on public.answer_options for select to authenticated using (public.can_view_question(question_id));
create policy "answer_options: insert" on public.answer_options for insert to authenticated with check (public.can_edit_question(question_id));
create policy "answer_options: update" on public.answer_options for update to authenticated
  using (public.can_edit_question(question_id)) with check (public.can_edit_question(question_id));
create policy "answer_options: delete" on public.answer_options for delete to authenticated using (public.can_edit_question(question_id));

create policy "question_answer_keys: read" on public.question_answer_keys for select to authenticated using (public.can_view_question(question_id));
create policy "question_answer_keys: insert" on public.question_answer_keys for insert to authenticated with check (public.can_edit_question(question_id));
create policy "question_answer_keys: update" on public.question_answer_keys for update to authenticated
  using (public.can_edit_question(question_id)) with check (public.can_edit_question(question_id));
create policy "question_answer_keys: delete" on public.question_answer_keys for delete to authenticated using (public.can_edit_question(question_id));

create policy "examinations: read" on public.examinations for select to authenticated using (
  public.can_edit_exam(id)
  or owner_student_id = (select auth.uid())
  or (is_published and owner_student_id is null and (
        classroom_id is null or public.is_classroom_member(classroom_id)
        or public.parent_has_child_in(classroom_id) or public.is_classroom_teacher(classroom_id))));
create policy "examinations: create" on public.examinations for insert to authenticated with check (
  (select public.is_active_teacher()) and created_by = (select auth.uid()) and owner_student_id is null
  and (classroom_id is null or public.is_classroom_teacher(classroom_id) or (select public.is_admin())));
create policy "examinations: update" on public.examinations for update to authenticated
  using (public.can_edit_exam(id))
  with check (owner_student_id is null and (classroom_id is null or public.is_classroom_teacher(classroom_id) or (select public.is_admin())));
create policy "examinations: delete" on public.examinations for delete to authenticated using (public.can_edit_exam(id));

create policy "exam_questions: read" on public.exam_questions for select to authenticated using (public.can_edit_exam(exam_id));
create policy "exam_questions: insert" on public.exam_questions for insert to authenticated
  with check (public.can_edit_exam(exam_id) and public.can_view_question(question_id));
create policy "exam_questions: update" on public.exam_questions for update to authenticated
  using (public.can_edit_exam(exam_id)) with check (public.can_edit_exam(exam_id));
create policy "exam_questions: delete" on public.exam_questions for delete to authenticated using (public.can_edit_exam(exam_id));

create policy "exam_attempts: read" on public.exam_attempts for select to authenticated using (
  student_id = (select auth.uid()) or (select public.is_admin()) or public.is_parent_of(student_id)
  or public.can_edit_exam(exam_id)
  or exists (select 1 from public.examinations e where e.id = exam_id and e.classroom_id is not null
             and public.is_classroom_teacher(e.classroom_id)));

create policy "student_answers: read" on public.student_answers for select to authenticated using (
  exists (select 1 from public.exam_attempts a where a.id = attempt_id and a.status <> 'in_progress'));

create policy "results: read" on public.results for select to authenticated using (
  student_id = (select auth.uid()) or (select public.is_admin()) or public.is_parent_of(student_id)
  or public.can_edit_exam(exam_id)
  or exists (select 1 from public.examinations e where e.id = exam_id and e.classroom_id is not null
             and public.is_classroom_teacher(e.classroom_id)));

-- ---------------------------------------------------------------------
-- Live classes, attendance, announcements, notifications
-- ---------------------------------------------------------------------
create policy "live_classes: read" on public.live_classes for select to authenticated using (
  public.is_classroom_teacher(classroom_id) or public.is_classroom_member(classroom_id)
  or public.parent_has_child_in(classroom_id) or (select public.is_admin()));
create policy "live_classes: create" on public.live_classes for insert to authenticated with check (
  (select public.is_active_teacher()) and teacher_id = (select auth.uid()) and public.is_classroom_teacher(classroom_id));
create policy "live_classes: update" on public.live_classes for update to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()))
  with check (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));
create policy "live_classes: delete" on public.live_classes for delete to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));

create policy "attendance: read" on public.attendance for select to authenticated using (
  student_id = (select auth.uid()) or public.is_parent_of(student_id)
  or public.is_classroom_teacher(classroom_id) or (select public.is_admin()));
create policy "attendance: mark" on public.attendance for insert to authenticated with check (
  (public.is_classroom_teacher(classroom_id) or (select public.is_admin()))
  and exists (select 1 from public.enrollments e where e.classroom_id = attendance.classroom_id and e.student_id = attendance.student_id));
create policy "attendance: update" on public.attendance for update to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()))
  with check (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));
create policy "attendance: delete" on public.attendance for delete to authenticated
  using (public.is_classroom_teacher(classroom_id) or (select public.is_admin()));

create policy "announcements: read" on public.announcements for select to authenticated using (
  public.is_classroom_teacher(classroom_id) or public.is_classroom_member(classroom_id)
  or public.parent_has_child_in(classroom_id) or (select public.is_admin()));
create policy "announcements: post" on public.announcements for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_classroom_teacher(classroom_id));
create policy "announcements: update" on public.announcements for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "announcements: delete" on public.announcements for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "notifications: read own" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: update own" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------
create policy "certificates: read" on public.certificates for select to authenticated using (
  student_id = (select auth.uid()) or public.is_parent_of(student_id)
  or public.teaches_student(student_id) or (select public.is_admin()));
create policy "certificates: admin issue" on public.certificates for insert to authenticated with check ((select public.is_admin()));

create policy "student_badges: read" on public.student_badges for select to authenticated using (
  student_id = (select auth.uid()) or public.is_parent_of(student_id)
  or public.teaches_student(student_id) or (select public.is_admin()));

create policy "points_ledger: read" on public.points_ledger for select to authenticated using (
  student_id = (select auth.uid()) or public.is_parent_of(student_id) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Billing (written by the server only)
-- ---------------------------------------------------------------------
create policy "subscriptions: read own" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "payments: read own" on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Moderated parent–teacher messaging
-- ---------------------------------------------------------------------
create policy "message_threads: read" on public.message_threads for select to authenticated using (
  parent_id = (select auth.uid()) or teacher_id = (select auth.uid()) or (select public.is_admin()));
create policy "message_threads: start" on public.message_threads for insert to authenticated with check (
  (parent_id = (select auth.uid()) and public.is_parent_of(student_id)
     and exists (select 1 from public.enrollments e join public.classrooms c on c.id = e.classroom_id
                 where c.teacher_id = message_threads.teacher_id and e.student_id = message_threads.student_id and e.status = 'active'))
  or (teacher_id = (select auth.uid()) and public.teaches_student(student_id)
     and exists (select 1 from public.parent_children pc
                 where pc.parent_id = message_threads.parent_id and pc.student_id = message_threads.student_id)));
create policy "message_threads: update" on public.message_threads for update to authenticated
  using (parent_id = (select auth.uid()) or teacher_id = (select auth.uid()) or (select public.is_admin()))
  with check (parent_id = (select auth.uid()) or teacher_id = (select auth.uid()) or (select public.is_admin()));

create policy "messages: read" on public.messages for select to authenticated using (
  exists (select 1 from public.message_threads t where t.id = thread_id));
create policy "messages: send" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.message_threads t where t.id = thread_id and t.status = 'open'
              and (t.parent_id = (select auth.uid()) or t.teacher_id = (select auth.uid()))));
create policy "messages: flag" on public.messages for update to authenticated
  using (exists (select 1 from public.message_threads t where t.id = thread_id))
  with check (exists (select 1 from public.message_threads t where t.id = thread_id));
create policy "messages: admin delete" on public.messages for delete to authenticated using ((select public.is_admin()));

create policy "reports: file" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports: read" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "reports: admin update" on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Platform
-- ---------------------------------------------------------------------
create policy "activity_logs: admin read" on public.activity_logs for select to authenticated using ((select public.is_admin()));
create policy "ai_messages: read" on public.ai_messages for select to authenticated using (
  student_id = (select auth.uid()) or public.is_parent_of(student_id) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Storage buckets (size and file-type limits are enforced by Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('materials', 'materials', false, 52428800, array[
     'application/pdf', 'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-powerpoint',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'video/mp4', 'video/webm', 'audio/mpeg', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']),
  ('submissions', 'submissions', false, 20971520, array[
     'application/pdf', 'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-powerpoint',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'image/png', 'image/jpeg', 'image/webp', 'text/plain']),
  ('teacher-documents', 'teacher-documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  ('question-images', 'question-images', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Files live under "<user id>/..." so ownership is checked by folder.
create policy "avatars: read" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials: read" on storage.objects for select to authenticated using (
  bucket_id = 'materials' and ((storage.foldername(name))[1] = (select auth.uid())::text
                               or (select public.is_admin()) or public.can_read_material_path(name)));
create policy "materials: upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'materials' and (select public.is_active_teacher()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "materials: update own" on storage.objects for update to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "materials: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'materials' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

create policy "submissions: read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.can_read_submission_path(name));
create policy "submissions: upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'submissions' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_user_role()) = 'student');
create policy "submissions: update own" on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "submissions: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "teacher-documents: read" on storage.objects for select to authenticated using (
  bucket_id = 'teacher-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "teacher-documents: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "teacher-documents: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "question-images: read" on storage.objects for select to authenticated using (bucket_id = 'question-images');
create policy "question-images: upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'question-images' and (select public.is_active_teacher()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "question-images: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
