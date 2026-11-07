-- =====================================================================
-- AfriLearn: term-by-term curriculum (class -> subject -> term -> topic)
-- Each topic holds its lesson notes, its videos and a short quiz.
-- Run after 2026-11-05-primary-and-videos.sql. Safe to run once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Topics
-- ---------------------------------------------------------------------
create table if not exists public.curriculum_topics (
  id uuid primary key default gen_random_uuid(),
  -- Short random code used in links, so addresses don't spell out the class, subject or topic.
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term smallint not null check (term between 1 and 3),
  theme text,
  sub_theme text,
  title text not null check (char_length(title) between 2 and 200),
  summary text check (summary is null or char_length(summary) <= 400),
  notes text check (notes is null or char_length(notes) <= 20000),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists curriculum_topics_class_subject on public.curriculum_topics (class_id, subject_id, term, sort_order);

alter table public.curriculum_topics enable row level security;
-- Topic titles are the public curriculum, so visitors can browse them; notes need an account.
grant select (id, code, class_id, subject_id, term, theme, sub_theme, title, summary, sort_order, is_published) on public.curriculum_topics to anon;
grant select, insert, update, delete on public.curriculum_topics to authenticated;

create policy "topics: read" on public.curriculum_topics for select to anon, authenticated
  using (is_published or (select public.is_admin()) or (select public.is_active_teacher()));
create policy "topics: admin add" on public.curriculum_topics for insert to authenticated
  with check ((select public.is_admin()));
create policy "topics: staff edit" on public.curriculum_topics for update to authenticated
  using ((select public.is_admin()) or (select public.is_active_teacher()))
  with check ((select public.is_admin()) or (select public.is_active_teacher()));
create policy "topics: admin remove" on public.curriculum_topics for delete to authenticated
  using ((select public.is_admin()));

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists curriculum_topics_touch on public.curriculum_topics;
create trigger curriculum_topics_touch before update on public.curriculum_topics
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------
-- 2. Topic quizzes. Pupils can read the questions but never the answers;
--    answers are checked on the server by check_topic_quiz().
-- ---------------------------------------------------------------------
create table if not exists public.topic_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.curriculum_topics(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 2 and 600),
  options text[] not null check (cardinality(options) between 2 and 5),
  answer smallint not null check (answer >= 0 and answer < 5),
  explanation text check (explanation is null or char_length(explanation) <= 800),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists topic_questions_topic on public.topic_questions (topic_id, sort_order);

alter table public.topic_questions enable row level security;
revoke all on public.topic_questions from anon, authenticated;
grant select (id, topic_id, prompt, options, sort_order) on public.topic_questions to authenticated;
grant insert, update, delete on public.topic_questions to authenticated;
-- Staff see the answers through staff_topic_questions().

create policy "topic_questions: read" on public.topic_questions for select to authenticated using (true);
create policy "topic_questions: staff add" on public.topic_questions for insert to authenticated
  with check ((select public.is_admin()) or (select public.is_active_teacher()));
create policy "topic_questions: staff edit" on public.topic_questions for update to authenticated
  using ((select public.is_admin()) or (select public.is_active_teacher()));
create policy "topic_questions: staff remove" on public.topic_questions for delete to authenticated
  using ((select public.is_admin()) or (select public.is_active_teacher()));

create or replace function public.staff_topic_questions(p_topic uuid)
returns table (id uuid, prompt text, options text[], answer smallint, explanation text, sort_order integer)
language sql stable security definer set search_path = '' as $$
  select q.id, q.prompt, q.options, q.answer, q.explanation, q.sort_order
  from public.topic_questions q
  where q.topic_id = p_topic and (public.is_admin() or public.is_active_teacher())
  order by q.sort_order, q.created_at
$$;
revoke all on function public.staff_topic_questions(uuid) from public, anon;
grant execute on function public.staff_topic_questions(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Each pupil's progress per topic
-- ---------------------------------------------------------------------
create table if not exists public.topic_progress (
  student_id uuid not null references public.students(profile_id) on delete cascade,
  topic_id uuid not null references public.curriculum_topics(id) on delete cascade,
  quiz_score smallint,
  quiz_total smallint,
  best_percent smallint,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);
create index if not exists topic_progress_topic on public.topic_progress (topic_id);

alter table public.topic_progress enable row level security;
revoke all on public.topic_progress from anon, authenticated;
grant select on public.topic_progress to authenticated;
create policy "topic_progress: read" on public.topic_progress for select to authenticated
  using (student_id = (select auth.uid()) or public.is_parent_of(student_id)
         or (select public.is_admin()) or (select public.is_active_teacher()));

-- Marks a topic as done for the signed-in pupil.
create or replace function public.mark_topic_done(p_topic uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.students where profile_id = auth.uid()) then return; end if;
  insert into public.topic_progress (student_id, topic_id, completed_at)
  values (auth.uid(), p_topic, now())
  on conflict (student_id, topic_id) do update set completed_at = coalesce(public.topic_progress.completed_at, now()), updated_at = now();
end $$;
revoke all on function public.mark_topic_done(uuid) from public, anon;
grant execute on function public.mark_topic_done(uuid) to authenticated;

-- Checks a pupil's quiz answers ({"question id": chosen option index}) and returns the marks.
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
    if v_pct >= 50 then
      update public.students set points = points + v_score * 5 where profile_id = auth.uid();
    end if;
  end if;
  return jsonb_build_object('score', v_score, 'total', v_total, 'items', v_items);
end $$;
revoke all on function public.check_topic_quiz(uuid, jsonb) from public, anon;
grant execute on function public.check_topic_quiz(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Videos belong to a topic, and can be hosted on VdoCipher (DRM)
-- ---------------------------------------------------------------------
alter table public.class_videos add column if not exists topic_id uuid references public.curriculum_topics(id) on delete set null;
alter table public.class_videos add column if not exists provider_video_id text;
create index if not exists class_videos_topic on public.class_videos (topic_id);
alter table public.class_videos drop constraint if exists class_videos_source_check;
alter table public.class_videos add constraint class_videos_source_check check (source in ('upload', 'youtube', 'link', 'vdocipher'));
alter table public.class_videos drop constraint if exists class_videos_check;
alter table public.class_videos add constraint class_videos_check check (
  (source = 'upload' and storage_path is not null) or (source = 'youtube' and youtube_id is not null)
  or (source = 'link' and external_url is not null) or (source = 'vdocipher' and provider_video_id is not null));

-- ---------------------------------------------------------------------
-- 5. Seed: English Studies and Mathematics, Primary 1 to 6, in the order of the
--    official curriculum's contents pages. Each theme's topics are spread across the
--    three terms in book order, so every term mixes reading, writing, speaking and grammar
--    (or number, measures, shapes and data); a theme with a single topic sits in the second term.
--    Admins can move topics between terms.
-- ---------------------------------------------------------------------
with src(cls, subj, theme, sub_theme, title) as (values
  -- English, Primary 1
  ('P1','english','Reading',null,'Phonological awareness'),
  ('P1','english','Reading',null,'Phonemic awareness'),
  ('P1','english','Reading',null,'Phonics'),
  ('P1','english','Reading',null,'Fluency'),
  ('P1','english','Reading',null,'Comprehension'),
  ('P1','english','Reading',null,'Vocabulary'),
  ('P1','english','Reading',null,'Concepts of print'),
  ('P1','english','Listening and Speaking',null,'Sounds and letters'),
  ('P1','english','Listening and Speaking',null,'Songs and rhymes'),
  ('P1','english','Listening and Speaking',null,'Simple greetings and commands'),
  ('P1','english','Listening and Speaking',null,'Naming people, objects, colours and animals'),
  ('P1','english','Listening and Speaking',null,'Expressing possession'),
  ('P1','english','Listening and Speaking',null,'Saying thank you and goodbye'),
  ('P1','english','Listening and Speaking',null,'Asking and answering questions'),
  ('P1','english','Grammatical Accuracy',null,'Nouns and pronouns'),
  ('P1','english','Grammatical Accuracy',null,'Singular and plural'),
  ('P1','english','Grammatical Accuracy',null,'Using "a" and "an"'),
  ('P1','english','Grammatical Accuracy',null,'Present and past actions'),
  -- English, Primary 2
  ('P2','english','Reading',null,'Phonemic awareness'),
  ('P2','english','Reading',null,'Phonics'),
  ('P2','english','Reading',null,'Fluency'),
  ('P2','english','Reading',null,'Comprehension'),
  ('P2','english','Reading',null,'Vocabulary'),
  ('P2','english','Reading',null,'Concepts of print'),
  ('P2','english','Listening and Speaking',null,'Review of Primary 1 work'),
  ('P2','english','Listening and Speaking',null,'Using sounds to spell and say words'),
  ('P2','english','Listening and Speaking',null,'Answering questions on passages, stories and rhymes'),
  ('P2','english','Listening and Speaking',null,'Questions about present, past and future actions'),
  ('P2','english','Listening and Speaking',null,'Expressing ownership'),
  ('P2','english','Listening and Speaking',null,'Songs and rhymes'),
  ('P2','english','Listening and Speaking',null,'Listening to and telling stories'),
  ('P2','english','Listening and Speaking',null,'Simple oral comprehension and games'),
  ('P2','english','Listening and Speaking',null,'Introducing people'),
  ('P2','english','Grammatical Accuracy',null,'Adjectives and adverbs'),
  ('P2','english','Grammatical Accuracy',null,'Regular and irregular plurals'),
  ('P2','english','Grammatical Accuracy',null,'Simple present and past tense'),
  ('P2','english','Grammatical Accuracy',null,'The apostrophe for possession'),
  ('P2','english','Grammatical Accuracy',null,'The present continuous tense'),
  -- English, Primary 3
  ('P3','english','Reading',null,'Phonemic awareness'),
  ('P3','english','Reading',null,'Phonics'),
  ('P3','english','Reading',null,'Fluency'),
  ('P3','english','Reading',null,'Comprehension'),
  ('P3','english','Reading',null,'Vocabulary'),
  ('P3','english','Writing',null,'Capital letters and punctuation marks'),
  ('P3','english','Writing',null,'Writing three or four sentences in present and past tense'),
  ('P3','english','Writing',null,'Handwriting'),
  ('P3','english','Writing',null,'Writing answers to comprehension questions'),
  ('P3','english','Listening and Speaking',null,'Consonants and consonant clusters'),
  ('P3','english','Listening and Speaking',null,'Simple statements and commands with stress and intonation'),
  ('P3','english','Listening and Speaking',null,'Dialogues about present, past and future actions'),
  ('P3','english','Listening and Speaking',null,'Oral comprehension'),
  ('P3','english','Listening and Speaking',null,'Vowels and diphthongs'),
  ('P3','english','Listening and Speaking',null,'Aural discrimination'),
  ('P3','english','Grammatical Accuracy',null,'Regular and irregular plurals in speaking and writing'),
  ('P3','english','Grammatical Accuracy',null,'Auxiliary verbs'),
  ('P3','english','Grammatical Accuracy',null,'Future actions in the negative'),
  ('P3','english','Grammatical Accuracy',null,'The past continuous tense'),
  ('P3','english','Grammatical Accuracy',null,'Present perfect with "-ed" and "-en" endings'),
  ('P3','english','Grammatical Accuracy',null,'Present perfect with "since" and "for"'),
  ('P3','english','Grammatical Accuracy',null,'Questions and answers in the present perfect'),
  -- English, Primary 4
  ('P4','english','Reading',null,'Comprehension'),
  ('P4','english','Reading',null,'Concepts of print'),
  ('P4','english','Writing',null,'Writing events in the right order (consumer, market and society)'),
  ('P4','english','Writing',null,'Guided informal letter: a letter to a friend'),
  ('P4','english','Writing',null,'Narrative and descriptive composition'),
  ('P4','english','Listening and Speaking',null,'Simple conversation using the right words'),
  ('P4','english','Listening and Speaking',null,'Hearing the difference in vowels and consonants'),
  ('P4','english','Listening and Speaking',null,'Oral composition: describing and narrating'),
  ('P4','english','Listening and Speaking',null,'Using question tags'),
  ('P4','english','Listening and Speaking',null,'Stress and intonation'),
  ('P4','english','Listening and Speaking',null,'Songs and poems'),
  ('P4','english','Grammatical Accuracy',null,'Past, present and future tenses'),
  ('P4','english','Grammatical Accuracy',null,'Nouns and pronouns'),
  ('P4','english','Grammatical Accuracy',null,'Adjectives and adverbs'),
  ('P4','english','Grammatical Accuracy',null,'Comparing with adjectives and adverbs'),
  ('P4','english','Grammatical Accuracy',null,'Question tags'),
  ('P4','english','Grammatical Accuracy',null,'Adverbial clauses with "if" and "when"'),
  -- English, Primary 5
  ('P5','english','Reading',null,'Phonics'),
  ('P5','english','Reading',null,'Comprehension'),
  ('P5','english','Reading',null,'Vocabulary'),
  ('P5','english','Writing',null,'Guided formal letter writing'),
  ('P5','english','Writing',null,'Narrative composition: the day I met road safety officials'),
  ('P5','english','Writing',null,'Descriptive composition: elements of soil'),
  ('P5','english','Writing',null,'Writing and replying to formal and informal invitations'),
  ('P5','english','Writing',null,'Replying to formal invitations'),
  ('P5','english','Writing',null,'Letters of congratulations and sympathy'),
  ('P5','english','Writing',null,'Replying to letters of congratulations or sympathy'),
  ('P5','english','Listening and Speaking',null,'Dialogues with the right stress and intonation'),
  ('P5','english','Listening and Speaking',null,'Using the telephone'),
  ('P5','english','Listening and Speaking',null,'Oral composition: talking about myself and my family'),
  ('P5','english','Listening and Speaking',null,'Debates on familiar topics'),
  ('P5','english','Grammatical Accuracy',null,'Adjectives and adverbs in speaking and writing'),
  ('P5','english','Grammatical Accuracy',null,'Arranging words in alphabetical order'),
  ('P5','english','Grammatical Accuracy',null,'Direct and indirect speech'),
  ('P5','english','Grammatical Accuracy',null,'Active and passive sentences'),
  ('P5','english','Grammatical Accuracy',null,'Present perfect and past perfect tense'),
  ('P5','english','Grammatical Accuracy',null,'Comparing with "same as"'),
  ('P5','english','Grammatical Accuracy',null,'Cause and effect with "so ... that"'),
  -- English, Primary 6
  ('P6','english','Reading',null,'Phonemic awareness'),
  ('P6','english','Reading',null,'Phonics'),
  ('P6','english','Reading',null,'Fluency'),
  ('P6','english','Reading',null,'Comprehension'),
  ('P6','english','Reading',null,'Vocabulary'),
  ('P6','english','Reading',null,'Concepts of print'),
  ('P6','english','Writing',null,'Writing paragraphs: introduction, middle and conclusion'),
  ('P6','english','Writing',null,'Writing for different purposes: letters, accounts and stories'),
  ('P6','english','Writing',null,'Writing e-mails and text messages'),
  ('P6','english','Writing',null,'Writing biographies and autobiographies'),
  ('P6','english','Listening and Speaking',null,'Intonation in commands, questions and statements'),
  ('P6','english','Listening and Speaking',null,'Reporting incidents: a car fire'),
  ('P6','english','Listening and Speaking',null,'A short play: the first aider'),
  ('P6','english','Listening and Speaking',null,'Intonation practice: the value of honesty'),
  ('P6','english','Listening and Speaking',null,'Describing vowels, consonants and diphthongs'),
  ('P6','english','Listening and Speaking',null,'Guided speech making'),
  ('P6','english','Listening and Speaking',null,'Listening: public notices and consumer education'),
  ('P6','english','Listening and Speaking',null,'Stress in words of one, two and more syllables'),
  ('P6','english','Listening and Speaking',null,'Speaking at intervals'),
  ('P6','english','Grammatical Accuracy',null,'Finding words in a dictionary'),
  ('P6','english','Grammatical Accuracy',null,'Idiomatic expressions'),
  ('P6','english','Grammatical Accuracy',null,'Word formation: synonyms and antonyms'),
  ('P6','english','Grammatical Accuracy',null,'Review of verb forms'),
  ('P6','english','Grammatical Accuracy',null,'Review of direct and indirect speech'),
  ('P6','english','Grammatical Accuracy',null,'Similes and metaphors'),
  -- Mathematics, Primary 1
  ('P1','mathematics','Number and Numeration','Whole numbers','Whole numbers 1 to 5'),
  ('P1','mathematics','Number and Numeration','Whole numbers','The number 0 (zero)'),
  ('P1','mathematics','Number and Numeration','Whole numbers','Whole numbers 6 to 9'),
  ('P1','mathematics','Number and Numeration','Whole numbers','The number 10'),
  ('P1','mathematics','Number and Numeration','Whole numbers','Whole numbers 1 to 99'),
  ('P1','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P1','mathematics','Basic Operations','Basic operations','Addition I'),
  ('P1','mathematics','Basic Operations','Basic operations','Subtraction I'),
  ('P1','mathematics','Basic Operations','Basic operations','Addition II'),
  ('P1','mathematics','Basic Operations','Basic operations','Subtraction II'),
  ('P1','mathematics','Algebraic Processes','Algebraic operations','Open sentences'),
  ('P1','mathematics','Mensuration and Geometry','Primary measures','Money'),
  ('P1','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P1','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P1','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P1','mathematics','Mensuration and Geometry','Shapes','Three-dimensional shapes'),
  ('P1','mathematics','Mensuration and Geometry','Shapes','Two-dimensional shapes'),
  ('P1','mathematics','Everyday Statistics','Data collection and presentation','Data collection'),
  -- Mathematics, Primary 2
  ('P2','mathematics','Number and Numeration','Whole numbers','Whole numbers 1 to 200'),
  ('P2','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P2','mathematics','Basic Operations','Basic operations','Addition'),
  ('P2','mathematics','Basic Operations','Basic operations','Subtraction'),
  ('P2','mathematics','Basic Operations','Basic operations','Multiplication'),
  ('P2','mathematics','Algebraic Processes','Open sentences','Open sentences'),
  ('P2','mathematics','Mensuration and Geometry','Primary measures','Money'),
  ('P2','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P2','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P2','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P2','mathematics','Mensuration and Geometry','Secondary measures','Capacity'),
  ('P2','mathematics','Mensuration and Geometry','Secondary measures','Area'),
  ('P2','mathematics','Mensuration and Geometry','Shapes','Three-dimensional shapes'),
  ('P2','mathematics','Mensuration and Geometry','Shapes','Two-dimensional shapes'),
  ('P2','mathematics','Everyday Statistics','Data collection and presentation','Data collection'),
  -- Mathematics, Primary 3
  ('P3','mathematics','Number and Numeration','Whole numbers','Whole numbers up to 999'),
  ('P3','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P3','mathematics','Basic Operations','Basic operations','Addition'),
  ('P3','mathematics','Basic Operations','Basic operations','Subtraction'),
  ('P3','mathematics','Basic Operations','Basic operations','Multiplication'),
  ('P3','mathematics','Basic Operations','Basic operations','Division'),
  ('P3','mathematics','Algebraic Processes','Open sentences','Open sentences'),
  ('P3','mathematics','Mensuration and Geometry','Primary measures','Money'),
  ('P3','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P3','mathematics','Mensuration and Geometry','Primary measures','Length II'),
  ('P3','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P3','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P3','mathematics','Mensuration and Geometry','Secondary measures','Capacity'),
  ('P3','mathematics','Mensuration and Geometry','Shapes','Symmetry'),
  ('P3','mathematics','Everyday Statistics','Data presentation','Pictograms'),
  -- Mathematics, Primary 4
  ('P4','mathematics','Number and Numeration','Whole numbers','Whole numbers'),
  ('P4','mathematics','Number and Numeration','Whole numbers','Lowest common multiple (LCM)'),
  ('P4','mathematics','Number and Numeration','Whole numbers','Highest common factor (HCF)'),
  ('P4','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P4','mathematics','Basic Operations','Basic operations','Addition and subtraction'),
  ('P4','mathematics','Basic Operations','Basic operations','Multiplication'),
  ('P4','mathematics','Basic Operations','Basic operations','Division'),
  ('P4','mathematics','Basic Operations','Derived functions','Estimation'),
  ('P4','mathematics','Algebraic Processes','Algebraic operations','Open sentences'),
  ('P4','mathematics','Mensuration and Geometry','Primary measures','Money'),
  ('P4','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P4','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P4','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P4','mathematics','Mensuration and Geometry','Secondary measures','Area'),
  ('P4','mathematics','Mensuration and Geometry','Secondary measures','Capacity'),
  ('P4','mathematics','Mensuration and Geometry','Shapes','Plane shapes'),
  ('P4','mathematics','Mensuration and Geometry','Shapes','Three-dimensional shapes'),
  ('P4','mathematics','Everyday Statistics','Data collection and presentation','Bar graphs'),
  -- Mathematics, Primary 5
  ('P5','mathematics','Number and Numeration','Whole numbers','Whole numbers'),
  ('P5','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P5','mathematics','Number and Numeration','Fractions','Multiplying fractions'),
  ('P5','mathematics','Number and Numeration','Fractions','Dividing fractions'),
  ('P5','mathematics','Basic Operations','Basic operations','Addition and subtraction'),
  ('P5','mathematics','Basic Operations','Derived operations','Using a number line to add and subtract'),
  ('P5','mathematics','Algebraic Processes','Algebraic operations','Open sentences'),
  ('P5','mathematics','Mensuration and Geometry','Primary measures','Money'),
  ('P5','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P5','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P5','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P5','mathematics','Mensuration and Geometry','Primary measures','Temperature'),
  ('P5','mathematics','Mensuration and Geometry','Secondary measures','Area'),
  ('P5','mathematics','Mensuration and Geometry','Secondary measures','Volume'),
  ('P5','mathematics','Mensuration and Geometry','Secondary measures','Capacity'),
  ('P5','mathematics','Mensuration and Geometry','Secondary measures','Structure of the earth'),
  ('P5','mathematics','Mensuration and Geometry','Shapes','Plane shapes'),
  ('P5','mathematics','Mensuration and Geometry','Shapes','Three-dimensional shapes'),
  ('P5','mathematics','Mensuration and Geometry','Shapes','The circle'),
  ('P5','mathematics','Everyday Statistics','Data collection and presentation','Data presentation'),
  ('P5','mathematics','Everyday Statistics','Data collection and presentation','Measures of central tendency'),
  ('P5','mathematics','Everyday Statistics','Chance and events','Tossing coins and throwing dice'),
  -- Mathematics, Primary 6
  ('P6','mathematics','Number and Numeration','Whole numbers','Whole numbers'),
  ('P6','mathematics','Number and Numeration','Whole numbers','Demography'),
  ('P6','mathematics','Number and Numeration','Fractions','Fractions'),
  ('P6','mathematics','Number and Numeration','Fractions','Ratios and proportions'),
  ('P6','mathematics','Number and Numeration','Fractions','Ratio of family size and resources'),
  ('P6','mathematics','Number and Numeration','Fractions','Ratio of two populations'),
  ('P6','mathematics','Number and Numeration','Fractions','Ratios in health data between groups and states'),
  ('P6','mathematics','Number and Numeration','Fractions','Percentages'),
  ('P6','mathematics','Basic Operations','Basic operations','Addition and subtraction'),
  ('P6','mathematics','Basic Operations','Basic operations','Multiplication'),
  ('P6','mathematics','Basic Operations','Basic operations','Division'),
  ('P6','mathematics','Basic Operations','Basic operations','Order of operations'),
  ('P6','mathematics','Basic Operations','Derived operations','Indices (powers)'),
  ('P6','mathematics','Basic Operations','Derived operations','Ratio and percentage'),
  ('P6','mathematics','Algebraic Processes','Open sentences','Open sentences'),
  ('P6','mathematics','Mensuration and Geometry','Primary measures','Money: population and the economy'),
  ('P6','mathematics','Mensuration and Geometry','Primary measures','Money: converting currencies'),
  ('P6','mathematics','Mensuration and Geometry','Primary measures','Length'),
  ('P6','mathematics','Mensuration and Geometry','Primary measures','Weight'),
  ('P6','mathematics','Mensuration and Geometry','Primary measures','Time'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Perimeter'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Area'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Volume'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Capacity'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Speed'),
  ('P6','mathematics','Mensuration and Geometry','Secondary measures','Athletics time'),
  ('P6','mathematics','Mensuration and Geometry','Shapes','Plane figures'),
  ('P6','mathematics','Mensuration and Geometry','Shapes','Angles'),
  ('P6','mathematics','Mensuration and Geometry','Shapes','Heights and distances'),
  ('P6','mathematics','Mensuration and Geometry','Shapes','Polygons'),
  ('P6','mathematics','Mensuration and Geometry','Shapes','Scale drawing'),
  ('P6','mathematics','Everyday Statistics','Data collection and presentation','Population'),
  ('P6','mathematics','Everyday Statistics','Data collection and presentation','Measures of central tendency')
), numbered as (
  select s.*, row_number() over () as book_order from src s
), placed as (
  select n.*,
    row_number() over (partition by cls, subj, theme order by book_order) as rn,
    count(*) over (partition by cls, subj, theme) as n_theme
  from numbered n
)
insert into public.curriculum_topics (class_id, subject_id, term, theme, sub_theme, title, sort_order)
select c.id, sb.id, (case when p.n_theme = 1 then 2 else least(3, 1 + floor((p.rn - 1) * 3.0 / p.n_theme)) end)::smallint, p.theme, p.sub_theme, p.title, p.book_order
from placed p
join public.classes c on c.code = p.cls
join public.subjects sb on sb.code = p.subj
where not exists (select 1 from public.curriculum_topics t where t.class_id = c.id and t.subject_id = sb.id);

-- English, Maths and Basic Science are the three core subjects for every Primary class.
insert into public.class_subjects (class_id, subject_id, is_compulsory)
select c.id, s.id, true from public.classes c cross join public.subjects s
where c.code in ('P1','P2','P3','P4','P5','P6') and s.code in ('english', 'mathematics', 'basic-science')
on conflict do nothing;

-- Pin the demo videos to their topics.
update public.class_videos v set topic_id = t.id
from public.curriculum_topics t join public.classes c on c.id = t.class_id join public.subjects s on s.id = t.subject_id
where v.class_id = c.id and v.subject_id = s.id and v.topic_id is null and (
  (c.code = 'P1' and t.title = 'Whole numbers 1 to 99') or
  (c.code = 'P2' and t.title = 'Time') or
  (c.code = 'P4' and s.code = 'english' and t.title = 'Nouns and pronouns') or
  (c.code = 'P5' and t.title = 'Fractions') or
  (c.code = 'P6' and t.title = 'Percentages'));
