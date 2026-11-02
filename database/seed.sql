-- =====================================================================
-- AfriLearn — reference data (safe to re-run)
-- =====================================================================

insert into public.roles (key, name, description) values
  ('student', 'Student', 'Learns, takes examinations and submits assignments'),
  ('teacher', 'Teacher', 'Runs classrooms, lessons and examinations after approval'),
  ('parent', 'Parent / Guardian', 'Follows the progress of linked children'),
  ('admin', 'Administrator', 'Manages the whole platform')
on conflict (key) do update set name = excluded.name, description = excluded.description;

insert into public.education_levels (key, name, description, sort_order) values
  ('nursery', 'Nursery', 'Early years: numbers, letters, sounds and the world around us', 1),
  ('primary', 'Primary', 'Primary 1 to Primary 6', 2),
  ('junior_secondary', 'Junior Secondary', 'JSS 1 to JSS 3 (Basic Education)', 3),
  ('senior_secondary', 'Senior Secondary', 'SS 1 to SS 3', 4),
  ('exam_prep', 'Exam Preparation', 'WAEC, NECO, JAMB, NABTEB, scholarship and entrance examinations', 5)
on conflict (key) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.classes (level_id, code, name, sort_order)
select l.id, v.code, v.name, v.sort
from (values
  ('nursery', 'N1', 'Nursery 1', 1), ('nursery', 'N2', 'Nursery 2', 2), ('nursery', 'N3', 'Nursery 3', 3),
  ('primary', 'P1', 'Primary 1', 4), ('primary', 'P2', 'Primary 2', 5), ('primary', 'P3', 'Primary 3', 6),
  ('primary', 'P4', 'Primary 4', 7), ('primary', 'P5', 'Primary 5', 8), ('primary', 'P6', 'Primary 6', 9),
  ('junior_secondary', 'JSS1', 'JSS 1', 10), ('junior_secondary', 'JSS2', 'JSS 2', 11), ('junior_secondary', 'JSS3', 'JSS 3', 12),
  ('senior_secondary', 'SS1', 'SS 1', 13), ('senior_secondary', 'SS2', 'SS 2', 14), ('senior_secondary', 'SS3', 'SS 3', 15),
  ('exam_prep', 'WAEC', 'WAEC (WASSCE)', 16), ('exam_prep', 'NECO', 'NECO (SSCE)', 17), ('exam_prep', 'JAMB', 'JAMB (UTME)', 18),
  ('exam_prep', 'NABTEB', 'NABTEB', 19), ('exam_prep', 'SCHOLARSHIP', 'Scholarship & Entrance', 20)
) v(level_key, code, name, sort)
join public.education_levels l on l.key = v.level_key
on conflict (code) do update set level_id = excluded.level_id, name = excluded.name, sort_order = excluded.sort_order;

insert into public.subjects (code, name, color) values
  ('number-work', 'Number Work', '#C2410C'),
  ('letter-work', 'Letter Work', '#7C3AED'),
  ('phonics', 'Phonics', '#DB2777'),
  ('rhymes', 'Rhymes & Songs', '#EA580C'),
  ('social-habits', 'Social Habits', '#0D9488'),
  ('health-habits', 'Health Habits', '#16A34A'),
  ('english', 'English Language', '#2B3A9F'),
  ('use-of-english', 'Use of English', '#2B3A9F'),
  ('mathematics', 'Mathematics', '#B45309'),
  ('further-mathematics', 'Further Mathematics', '#92400E'),
  ('basic-science', 'Basic Science', '#047857'),
  ('basic-technology', 'Basic Technology', '#475569'),
  ('social-studies', 'Social Studies', '#0E7490'),
  ('civic-education', 'Civic Education', '#1D4ED8'),
  ('computer-studies', 'Computer Studies', '#4338CA'),
  ('agricultural-science', 'Agricultural Science', '#3F6212'),
  ('crs', 'Christian Religious Studies', '#9D174D'),
  ('irs', 'Islamic Religious Studies', '#065F46'),
  ('creative-arts', 'Cultural & Creative Arts', '#BE185D'),
  ('history', 'History', '#78350F'),
  ('home-economics', 'Home Economics', '#C026D3'),
  ('phe', 'Physical & Health Education', '#15803D'),
  ('nigerian-language', 'Nigerian Language', '#A16207'),
  ('french', 'French', '#1E40AF'),
  ('business-studies', 'Business Studies', '#0F766E'),
  ('quantitative-reasoning', 'Quantitative Reasoning', '#B91C1C'),
  ('verbal-reasoning', 'Verbal Reasoning', '#6D28D9'),
  ('biology', 'Biology', '#15803D'),
  ('chemistry', 'Chemistry', '#0369A1'),
  ('physics', 'Physics', '#7E22CE'),
  ('economics', 'Economics', '#A16207'),
  ('government', 'Government', '#1E3A8A'),
  ('literature', 'Literature in English', '#9F1239'),
  ('geography', 'Geography', '#0F766E'),
  ('financial-accounting', 'Financial Accounting', '#334155'),
  ('commerce', 'Commerce', '#C2410C'),
  ('technical-drawing', 'Technical Drawing', '#374151')
on conflict (code) do update set name = excluded.name, color = excluded.color;

-- Which subjects belong to which classes (administrators can change this).
with m(class_codes, subject_codes) as (values
  (array['N1', 'N2', 'N3'],
   array['number-work', 'letter-work', 'phonics', 'rhymes', 'basic-science', 'creative-arts', 'social-habits', 'health-habits']),
  (array['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
   array['english', 'mathematics', 'basic-science', 'basic-technology', 'social-studies', 'civic-education',
         'computer-studies', 'agricultural-science', 'crs', 'irs', 'creative-arts', 'history', 'home-economics',
         'phe', 'nigerian-language', 'french']),
  (array['P4', 'P5', 'P6'], array['quantitative-reasoning', 'verbal-reasoning']),
  (array['JSS1', 'JSS2', 'JSS3'],
   array['english', 'mathematics', 'basic-science', 'basic-technology', 'social-studies', 'civic-education',
         'computer-studies', 'agricultural-science', 'crs', 'irs', 'creative-arts', 'history', 'home-economics',
         'phe', 'business-studies', 'nigerian-language', 'french']),
  (array['SS1', 'SS2', 'SS3', 'WAEC', 'NECO'],
   array['english', 'mathematics', 'further-mathematics', 'biology', 'chemistry', 'physics', 'economics',
         'government', 'literature', 'geography', 'financial-accounting', 'commerce', 'civic-education',
         'agricultural-science', 'computer-studies', 'crs', 'irs', 'technical-drawing', 'history']),
  (array['NABTEB'],
   array['english', 'mathematics', 'physics', 'chemistry', 'biology', 'economics', 'commerce',
         'financial-accounting', 'technical-drawing', 'computer-studies', 'agricultural-science']),
  (array['JAMB'],
   array['use-of-english', 'mathematics', 'physics', 'chemistry', 'biology', 'economics', 'government',
         'literature', 'geography', 'commerce', 'financial-accounting', 'crs', 'irs', 'agricultural-science', 'history']),
  (array['SCHOLARSHIP'], array['mathematics', 'english', 'quantitative-reasoning', 'verbal-reasoning', 'basic-science'])
)
insert into public.class_subjects (class_id, subject_id)
select c.id, s.id
from m
cross join lateral unnest(m.class_codes) as cc(code)
cross join lateral unnest(m.subject_codes) as sc(code)
join public.classes c on c.code = cc.code
join public.subjects s on s.code = sc.code
on conflict do nothing;

update public.class_subjects cs set is_compulsory = true
from public.subjects s, public.classes c
where s.id = cs.subject_id and c.id = cs.class_id
  and (s.code in ('english', 'mathematics', 'use-of-english', 'number-work', 'letter-work')
       or (s.code = 'civic-education' and c.code in ('SS1', 'SS2', 'SS3')));

-- Plans are editable by administrators. Prices are in kobo (₦1 = 100 kobo).
insert into public.subscription_plans (key, name, description, audience, price_kobo, billing_interval, features, is_featured, sort_order) values
  ('free', 'Free learning', 'Start learning at no cost.', 'student', 0, 'month',
   array['Self-paced lessons for your class', 'Join classrooms with a class code', 'CBT practice with explanations', 'Progress tracking and badges'], false, 1),
  ('standard', 'Standard student', 'Everything a learner needs for the school term.', 'student', 250000, 'month',
   array['Everything in Free', 'Assignments with teacher feedback', 'Downloadable notes and materials', 'Timed mock examinations'], false, 2),
  ('premium', 'Premium student', 'Live teaching and the AI learning companion.', 'student', 500000, 'month',
   array['Everything in Standard', 'Live classes with teachers', 'AI learning companion', 'Certificates for completed courses'], true, 3),
  ('exam-prep', 'Exam preparation', 'Focused WAEC, NECO and JAMB preparation.', 'student', 400000, 'month',
   array['Timed mock examinations in CBT format', 'Topic-by-topic practice', 'Performance reports by subject', 'Review of every wrong answer'], false, 4),
  ('teacher', 'Teacher account', 'Free for approved teachers.', 'teacher', 0, 'month',
   array['Unlimited classrooms', 'Question banks and exam builder', 'Gradebook and attendance', 'Live classes'], false, 5),
  ('school', 'School or institution', 'For schools enrolling whole classes.', 'school', null, 'year',
   array['All features for every student and teacher', 'School administrator dashboard', 'Bulk enrolment and termly reports', 'Priority support'], false, 6)
on conflict (key) do update
  set name = excluded.name, description = excluded.description, audience = excluded.audience,
      price_kobo = excluded.price_kobo, billing_interval = excluded.billing_interval,
      features = excluded.features, is_featured = excluded.is_featured, sort_order = excluded.sort_order;

insert into public.platform_settings (key, value, description, is_public) values
  ('brand', '{"name": "AfriLearn", "tagline": "Learning Without Limits."}', 'Brand name and tagline', true),
  ('registration_open', 'true', 'Allow new sign-ups', true),
  ('paid_features_enabled', 'false', 'When false, every feature is free (pilot mode)', true),
  ('leaderboards_enabled', 'true', 'Allow teachers to switch on class leaderboards', true),
  ('ai_companion_enabled', 'true', 'Show the AI learning companion to students', true),
  ('ai_daily_limit', '40', 'AI companion questions per student per 24 hours', false),
  ('live_classes_enabled', 'true', 'Allow teachers to schedule live classes', true),
  ('support_email', '"support@afrilearn.ng"', 'Contact address shown to users', true)
on conflict (key) do nothing;

insert into public.badges (key, name, description, icon, points) values
  ('first_steps', 'First steps', 'Earned your first learning points.', 'sparkles', 0),
  ('century', 'Century', 'Reached 100 learning points.', 'trophy', 0),
  ('scholar', 'Scholar', 'Reached 500 learning points.', 'graduation-cap', 0),
  ('streak_7', 'Seven-day streak', 'Learned on seven days in a row.', 'flame', 0),
  ('first_exam', 'First exam', 'Completed your first test or examination.', 'clipboard-check', 0),
  ('perfect_score', 'Perfect score', 'Scored 100% on a test.', 'star', 0),
  ('course_complete', 'Course complete', 'Finished every lesson in a course.', 'award', 0)
on conflict (key) do update set name = excluded.name, description = excluded.description, icon = excluded.icon;

insert into public.weekly_challenges (title, description, metric, target, points, starts_on, ends_on)
select 'Five-lesson week', 'Complete five lessons before Sunday night.', 'lessons_completed', 5, 50,
       date_trunc('week', now() at time zone 'Africa/Lagos')::date,
       (date_trunc('week', now() at time zone 'Africa/Lagos') + interval '6 days')::date
where not exists (select 1 from public.weekly_challenges);
