-- =====================================================================
-- AfriLearn — database schema (Supabase / PostgreSQL 15+)
-- Run order: schema.sql -> functions.sql -> policies.sql -> seed.sql
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Internal schema: never exposed through the Supabase API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Short human-friendly codes (class join codes, parent link codes).
create or replace function public.gen_code(len int default 8)
returns text language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, len);
$$;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create table public.roles (
  key text primary key,
  name text not null,
  description text
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' references public.roles (key),
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  full_name text not null default '',
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------
create table public.education_levels (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.education_levels (id) on delete restrict,
  code text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  color text not null default '#2B3A9F',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.class_subjects (
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  is_compulsory boolean not null default false,
  primary key (class_id, subject_id)
);

-- ---------------------------------------------------------------------
-- Role-specific records
-- ---------------------------------------------------------------------
create table public.students (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  interests text[] not null default '{}',
  guardian_name text,
  guardian_email text,
  guardian_consent boolean not null default false,
  guardian_consent_at timestamptz,
  managed_by_parent uuid references public.profiles (id) on delete set null,
  link_code text not null unique default public.gen_code(8),
  points int not null default 0,
  streak_days int not null default 0,
  last_active_on date,
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  qualification text,
  institution text,
  years_experience int check (years_experience between 0 and 70),
  bio text,
  document_paths text[] not null default '{}',
  application_status text not null default 'pending' check (application_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_subjects (
  teacher_id uuid not null references public.teachers (profile_id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table public.teacher_classes (
  teacher_id uuid not null references public.teachers (profile_id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  primary key (teacher_id, class_id)
);

create table public.parents (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  parent_id uuid not null references public.parents (profile_id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  relationship text not null default 'guardian',
  linked_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ---------------------------------------------------------------------
-- Classrooms, courses, lessons, materials
-- ---------------------------------------------------------------------
create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  class_id uuid references public.classes (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  join_code text not null unique default public.gen_code(6),
  leaderboard_enabled boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'removed')),
  enrolled_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  subject_id uuid references public.subjects (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  classroom_id uuid references public.classrooms (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  cover_url text,
  difficulty text not null default 'standard' check (difficulty in ('foundation', 'standard', 'advanced')),
  estimated_hours numeric(5, 1),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  title text not null,
  summary text,
  content text,
  video_url text,
  video_path text,
  duration_minutes int,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  material_type text not null default 'pdf' check (material_type in ('pdf', 'video', 'slides', 'document', 'image', 'link', 'other')),
  storage_path text,
  external_url text,
  mime_type text,
  file_size_bytes bigint,
  course_id uuid references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  classroom_id uuid references public.classrooms (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  library_category text not null default 'class_notes' check (library_category in ('textbook', 'class_notes', 'revision_guide', 'video_lesson', 'practice', 'exam_prep', 'teacher_resource')),
  audience text not null default 'students' check (audience in ('public', 'students', 'teachers')),
  is_downloadable boolean not null default true,
  is_approved boolean not null default true,
  license_note text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  download_count int not null default 0,
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create table public.lesson_progress (
  student_id uuid not null references public.students (profile_id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  total_marks numeric(6, 2) not null default 100 check (total_marks > 0),
  due_at timestamptz not null,
  allow_late boolean not null default true,
  accepted_file_types text[] not null default '{pdf,docx,jpg,jpeg,png}',
  max_file_mb int not null default 10 check (max_file_mb between 1 and 50),
  attachment_paths text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  file_paths text[] not null default '{}',
  text_answer text,
  status text not null default 'submitted' check (status in ('submitted', 'late', 'graded')),
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  score numeric(6, 2),
  feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ---------------------------------------------------------------------
-- Question banks and examinations
-- ---------------------------------------------------------------------
create table public.question_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  subject_id uuid references public.subjects (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  exam_body text check (exam_body in ('WAEC', 'NECO', 'JAMB', 'NABTEB', 'SCHOLARSHIP')),
  owner_id uuid references public.profiles (id) on delete set null,
  is_shared boolean not null default false,
  source_license text not null default 'Original content',
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid references public.question_banks (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  topic text,
  question_type text not null default 'mcq' check (question_type in ('mcq', 'true_false', 'short_answer', 'essay')),
  body text not null,
  image_path text,
  marks numeric(5, 2) not null default 1 check (marks > 0),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  exam_body text,
  created_by uuid references public.profiles (id) on delete set null,
  source_license text not null default 'Original content',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  body text not null,
  sort_order int not null default 0
);

-- Answers live apart from questions so students can never read them.
create table public.question_answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_option_ids uuid[] not null default '{}',
  accepted_answers text[] not null default '{}',
  explanation text,
  updated_at timestamptz not null default now()
);

create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructions text,
  exam_type text not null default 'test' check (exam_type in ('test', 'exam', 'practice', 'mock')),
  exam_body text check (exam_body in ('WAEC', 'NECO', 'JAMB', 'NABTEB', 'SCHOLARSHIP')),
  subject_id uuid references public.subjects (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  classroom_id uuid references public.classrooms (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  owner_student_id uuid references public.students (profile_id) on delete cascade,
  duration_minutes int not null default 30 check (duration_minutes between 1 and 600),
  pass_mark numeric(5, 2) not null default 50,
  randomize_questions boolean not null default true,
  randomize_options boolean not null default true,
  show_results_immediately boolean not null default true,
  show_explanations boolean not null default true,
  max_attempts int check (max_attempts is null or max_attempts > 0),
  available_from timestamptz,
  available_until timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exam_questions (
  exam_id uuid not null references public.examinations (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  sort_order int not null default 0,
  marks numeric(5, 2),
  primary key (exam_id, question_id)
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.examinations (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  attempt_no int not null default 1,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'graded')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  question_order uuid[] not null default '{}',
  option_order jsonb not null default '{}',
  score numeric(7, 2),
  max_score numeric(7, 2),
  percentage numeric(5, 2),
  needs_manual_grading boolean not null default false,
  graded_at timestamptz,
  unique (exam_id, student_id, attempt_no)
);

create table public.student_answers (
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_id uuid references public.answer_options (id) on delete set null,
  text_answer text,
  is_correct boolean,
  awarded_marks numeric(5, 2),
  feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts (id) on delete cascade,
  exam_id uuid not null references public.examinations (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  score numeric(7, 2) not null,
  max_score numeric(7, 2) not null,
  percentage numeric(5, 2) not null,
  grade text not null,
  passed boolean not null,
  remarks text,
  published_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Live classes, attendance, announcements, notifications
-- ---------------------------------------------------------------------
create table public.live_classes (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  duration_minutes int not null default 60 check (duration_minutes between 10 and 300),
  provider text not null default 'jaas' check (provider in ('jaas', 'jitsi')),
  room_name text not null unique default ('afrilearn-' || lower(public.gen_code(12))),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  recording_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  live_class_id uuid references public.live_classes (id) on delete cascade,
  attended_on date not null default ((now() at time zone 'Africa/Lagos')::date),
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'excused')),
  marked_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (classroom_id, student_id, attended_on, live_class_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  category text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Achievements and gamification
-- ---------------------------------------------------------------------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text,
  certificate_no text not null unique default ('AFL-' || public.gen_code(10)),
  issued_by uuid references public.profiles (id) on delete set null,
  issued_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  icon text not null default 'award',
  points int not null default 0
);

create table public.student_badges (
  student_id uuid not null references public.students (profile_id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);

create table public.points_ledger (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  points int not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create table public.weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  metric text not null check (metric in ('lessons_completed', 'practice_questions', 'assignments_submitted')),
  target int not null check (target > 0),
  points int not null default 50,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- Subscriptions and payments
-- ---------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  audience text not null default 'student' check (audience in ('student', 'parent', 'teacher', 'school')),
  price_kobo bigint check (price_kobo is null or price_kobo >= 0),
  billing_interval text not null default 'month' check (billing_interval in ('month', 'term', 'year', 'once')),
  features text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid references public.subscription_plans (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null check (provider in ('paystack', 'flutterwave')),
  reference text not null unique,
  amount_kobo bigint not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned')),
  provider_payload jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Moderated parent–teacher messaging (students are never participants)
-- ---------------------------------------------------------------------
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (profile_id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  is_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('user', 'message', 'material', 'course', 'other')),
  target_id uuid,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Platform
-- ---------------------------------------------------------------------
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text not null,
  quote text not null,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  subject_id uuid references public.subjects (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index on public.profiles (role, status);
create index on public.classes (level_id);
create index on public.class_subjects (subject_id);
create index on public.students (class_id);
create index on public.students (managed_by_parent);
create index on public.teachers (reviewed_by);
create index on public.teacher_subjects (subject_id);
create index on public.teacher_classes (class_id);
create index on public.parent_children (student_id);
create index on public.classrooms (teacher_id);
create index on public.classrooms (class_id);
create index on public.classrooms (subject_id);
create index on public.enrollments (student_id);
create index on public.courses (subject_id);
create index on public.courses (class_id);
create index on public.courses (classroom_id);
create index on public.courses (teacher_id);
create index on public.topics (course_id);
create index on public.lessons (course_id, sort_order);
create index on public.lessons (topic_id);
create index on public.learning_materials (course_id);
create index on public.learning_materials (lesson_id);
create index on public.learning_materials (classroom_id);
create index on public.learning_materials (subject_id);
create index on public.learning_materials (class_id);
create index on public.learning_materials (uploaded_by);
create index on public.learning_materials (storage_path);
create index on public.lesson_progress (lesson_id);
create index on public.assignments (classroom_id, due_at);
create index on public.assignments (course_id);
create index on public.assignments (teacher_id);
create index on public.assignment_submissions (student_id);
create index on public.assignment_submissions (graded_by);
create index on public.question_banks (owner_id);
create index on public.question_banks (subject_id);
create index on public.question_banks (class_id);
create index on public.questions (bank_id);
create index on public.questions (subject_id, topic);
create index on public.questions (class_id);
create index on public.questions (created_by);
create index on public.answer_options (question_id, sort_order);
create index on public.examinations (classroom_id);
create index on public.examinations (subject_id);
create index on public.examinations (class_id);
create index on public.examinations (created_by);
create index on public.examinations (owner_student_id);
create index on public.examinations (exam_body, is_published);
create index on public.exam_questions (question_id);
create index on public.exam_attempts (student_id, exam_id);
create index on public.student_answers (question_id);
create index on public.student_answers (selected_option_id);
create index on public.student_answers (graded_by);
create index on public.results (student_id);
create index on public.results (exam_id);
create index on public.live_classes (classroom_id, starts_at);
create index on public.live_classes (teacher_id);
create index on public.attendance (student_id);
create index on public.attendance (live_class_id);
create index on public.attendance (marked_by);
create index on public.announcements (classroom_id, created_at desc);
create index on public.announcements (author_id);
create index on public.notifications (user_id, is_read, created_at desc);
create index on public.certificates (student_id);
create index on public.certificates (course_id);
create index on public.certificates (issued_by);
create index on public.student_badges (badge_id);
create index on public.points_ledger (student_id, created_at desc);
create index on public.subscriptions (user_id);
create index on public.subscriptions (plan_id);
create index on public.payments (user_id);
create index on public.payments (plan_id);
create index on public.payments (subscription_id);
create index on public.message_threads (parent_id);
create index on public.message_threads (teacher_id);
create index on public.message_threads (student_id);
create index on public.messages (thread_id, created_at);
create index on public.messages (sender_id);
create index on public.reports (reporter_id);
create index on public.reports (resolved_by);
create index on public.activity_logs (created_at desc);
create index on public.activity_logs (actor_id);
create index on public.platform_settings (updated_by);
create index on public.ai_messages (student_id, created_at desc);
create index on public.ai_messages (subject_id);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles', 'students', 'teachers', 'classrooms', 'courses', 'lessons',
    'assignments', 'assignment_submissions', 'questions', 'examinations', 'live_classes',
    'subscriptions', 'message_threads', 'lesson_progress', 'question_answer_keys']
  loop
    execute format('create trigger touch_updated_at before update on public.%I
      for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;
