-- Demo content for the Primary 1 to 6 version of the platform: classrooms, courses, question banks,
-- tests with marked results, assignments, live classes, announcements and class videos.
-- Run once, after 2026-11-05-primary-and-videos.sql. Uses the demo accounts from seed data.

-- Helpers used only while seeding (dropped at the end).
create or replace function private.seed_mcq(p_bank uuid, p_topic text, p_body text, p_options text[], p_correct int,
                                            p_explanation text, p_difficulty text default 'easy')
returns uuid language plpgsql set search_path = '' as $$
declare b public.question_banks; v_q uuid; v_opt uuid; v_correct uuid;
begin
  select * into b from public.question_banks where id = p_bank;
  insert into public.questions (bank_id, subject_id, class_id, topic, question_type, body, marks, difficulty, created_by, created_at)
  values (b.id, b.subject_id, b.class_id, p_topic, 'mcq', p_body, 1, p_difficulty, b.owner_id, clock_timestamp())
  returning id into v_q;
  for i in 1 .. array_length(p_options, 1) loop
    insert into public.answer_options (question_id, body, sort_order) values (v_q, p_options[i], i) returning id into v_opt;
    if i = p_correct then v_correct := v_opt; end if;
  end loop;
  insert into public.question_answer_keys (question_id, correct_option_ids, explanation) values (v_q, array[v_correct], p_explanation);
  return v_q;
end $$;

-- Adds the first p_n questions of a bank (in the order they were written), optionally skipping some.
create or replace function private.seed_exam_questions(p_exam uuid, p_bank uuid, p_pick int[])
returns void language sql set search_path = '' as $$
  insert into public.exam_questions (exam_id, question_id, sort_order)
  select p_exam, q.id, row_number() over (order by array_position(p_pick, q.n))
  from (select id, row_number() over (order by created_at)::int as n from public.questions where bank_id = p_bank) q
  where q.n = any (p_pick);
$$;

-- A finished attempt, marked by the platform's own marking functions.
create or replace function private.seed_attempt(p_exam uuid, p_student uuid, p_right boolean[], p_when timestamptz)
returns uuid language plpgsql set search_path = '' as $$
declare v_a uuid; v_qs uuid[]; v_mins int; v_opt uuid; v_order jsonb; v_done timestamptz;
begin
  select array_agg(question_id order by sort_order) into v_qs from public.exam_questions where exam_id = p_exam;
  select duration_minutes into v_mins from public.examinations where id = p_exam;
  select jsonb_object_agg(o.question_id::text, o.ids) into v_order
  from (select question_id, jsonb_agg(id order by random()) as ids from public.answer_options
        where question_id = any (v_qs) group by question_id) o;
  insert into public.exam_attempts (exam_id, student_id, attempt_no, status, started_at, expires_at, question_order, option_order)
  values (p_exam, p_student, 1, 'in_progress', p_when, p_when + make_interval(mins => v_mins), v_qs, coalesce(v_order, '{}'))
  returning id into v_a;
  for i in 1 .. array_length(v_qs, 1) loop
    if p_right[i] then
      select k.correct_option_ids[1] into v_opt from public.question_answer_keys k where k.question_id = v_qs[i];
    else
      select o.id into v_opt from public.answer_options o
      where o.question_id = v_qs[i]
        and not exists (select 1 from public.question_answer_keys k where k.question_id = v_qs[i] and o.id = any (k.correct_option_ids))
      order by o.sort_order limit 1;
    end if;
    insert into public.student_answers (attempt_id, question_id, selected_option_id, answered_at)
    values (v_a, v_qs[i], v_opt, p_when + make_interval(secs => 50 * i));
  end loop;
  perform private.grade_attempt(v_a);
  v_done := p_when + make_interval(secs => 50 * array_length(v_qs, 1) + 20);
  update public.exam_attempts set submitted_at = v_done, graded_at = v_done where id = v_a;
  update public.results set published_at = v_done where attempt_id = v_a;
  update public.notifications set created_at = v_done, is_read = true where user_id = p_student and link like '%' || v_a::text;
  return v_a;
end $$;

do $$
declare
  tunde constant uuid := 'd0000000-0000-4000-a000-000000000002';
  ngozi constant uuid := 'd0000000-0000-4000-a000-000000000003';
  amina constant uuid := 'd0000000-0000-4000-a000-000000000011';
  chidi constant uuid := 'd0000000-0000-4000-a000-000000000012';
  emeka constant uuid := 'd0000000-0000-4000-a000-000000000015';
  ikimi constant uuid := '52d2837f-c93f-4000-bcf7-3d7d9fa86ca6';
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
  maths uuid; english uuid; science uuid; social uuid;
  c_p5m constant uuid := 'e1000000-0000-4000-a000-000000000001';
  c_p5s constant uuid := 'e1000000-0000-4000-a000-000000000002';
  c_p6m constant uuid := 'e1000000-0000-4000-a000-000000000003';
  c_p2m constant uuid := 'e1000000-0000-4000-a000-000000000004';
  c_p4e constant uuid := 'e4cd6d17-753c-4038-9d5e-113b7f1defd8';
  c_p4r constant uuid := '3aa67c27-3ee2-4cce-9be3-bd09fccf5a0e';
  k_time constant uuid := 'e2000000-0000-4000-a000-000000000001';
  k_plants constant uuid := 'e2000000-0000-4000-a000-000000000002';
  k_nigeria constant uuid := 'e2000000-0000-4000-a000-000000000003';
  k_percent constant uuid := 'e2000000-0000-4000-a000-000000000004';
  b_frac constant uuid := 'e3000000-0000-4000-a000-000000000001';
  b_eng constant uuid := 'e3000000-0000-4000-a000-000000000002';
  b_plants constant uuid := 'e3000000-0000-4000-a000-000000000003';
  b_pct constant uuid := 'e3000000-0000-4000-a000-000000000004';
  x_frac constant uuid := 'e4000000-0000-4000-a000-000000000001';
  x_pct constant uuid := 'e4000000-0000-4000-a000-000000000002';
  x_quiz constant uuid := 'e4000000-0000-4000-a000-000000000003';
  x_sci constant uuid := 'e4000000-0000-4000-a000-000000000004';
begin
  select id into p1 from public.classes where code = 'P1';
  select id into p2 from public.classes where code = 'P2';
  select id into p3 from public.classes where code = 'P3';
  select id into p4 from public.classes where code = 'P4';
  select id into p5 from public.classes where code = 'P5';
  select id into p6 from public.classes where code = 'P6';
  select id into maths from public.subjects where code = 'mathematics';
  select id into english from public.subjects where code = 'english';
  select id into science from public.subjects where code = 'basic-science';
  select id into social from public.subjects where code = 'social-studies';

  -- Classrooms -------------------------------------------------------------------------------
  insert into public.classrooms (id, name, description, class_id, subject_id, teacher_id, join_code, leaderboard_enabled) values
    (c_p5m, 'Primary 5 Mathematics', 'Fractions, decimals, measurement and problem solving for Primary 5.', p5, maths, tunde, 'MATHP5', true),
    (c_p5s, 'Primary 5 Basic Science', 'Living things, our body, energy and the world around us.', p5, science, tunde, 'SCIP5', false),
    (c_p6m, 'Primary 6 Mathematics', 'Percentages, ratio, geometry and Common Entrance practice.', p6, maths, tunde, 'MATHP6', true),
    (c_p2m, 'Primary 2 Maths Corner', 'Numbers, shapes, money and telling the time.', p2, maths, ngozi, 'NUMP2', false);
  insert into public.enrollments (classroom_id, student_id, enrolled_at) values
    (c_p5m, amina, now() - interval '10 days'), (c_p5s, amina, now() - interval '10 days'),
    (c_p6m, chidi, now() - interval '9 days'), (c_p6m, emeka, now() - interval '9 days'), (c_p6m, ikimi, now() - interval '2 days')
  on conflict (classroom_id, student_id) do update set status = 'active';

  -- Courses ----------------------------------------------------------------------------------
  insert into public.courses (id, title, slug, summary, description, subject_id, class_id, teacher_id, difficulty, estimated_hours, is_published, is_featured) values
    (k_time, 'Telling the Time', 'telling-the-time-p2', 'Read o''clock, half past and quarter times on a clock face.',
     'Three short lessons that turn the clock on the classroom wall into something every pupil can read.', maths, p2, ngozi, 'foundation', 1.5, true, true),
    (k_plants, 'Plants Around Us', 'plants-around-us-p3', 'The parts of a plant, what plants need, and the plants we eat.',
     'Pupils explore roots, stems, leaves, flowers and seeds using plants they see every day in Nigeria.', science, p3, tunde, 'foundation', 1.5, true, true),
    (k_nigeria, 'Our Country, Nigeria', 'our-country-nigeria-p4', 'Our states, our national symbols and the many peoples of one nation.',
     'A friendly tour of Nigeria for Primary 4: the map, the flag and coat of arms, and how we live together.', social, p4, ngozi, 'standard', 2, true, true),
    (k_percent, 'Percentages Made Easy', 'percentages-made-easy-p6', 'What percentages mean and how to use them at the market and in Common Entrance.',
     'From "out of a hundred" to discounts and test scores, with Common Entrance style questions.', maths, p6, tunde, 'standard', 2, true, true);

  insert into public.lessons (course_id, title, summary, content, video_url, duration_minutes, sort_order) values
    (k_time, 'Meet the clock', 'The numbers, the short hand and the long hand.', $md$# Meet the clock
A clock face has the numbers **1 to 12** going round in a circle.

- The **short hand** points to the **hour**.
- The **long hand** points to the **minutes**.

## Try it
Look at a clock at home or in your classroom. Which number is the short hand pointing to? Say it out loud: *"It is about ___ o'clock."*

> Tip: the hands always move the same way round. We call this **clockwise**.$md$, null, 8, 1),
    (k_time, 'O''clock and half past', 'Read times when the long hand is on 12 or on 6.', $md$# O'clock and half past
When the **long hand is on 12**, it is **o'clock**.
- Short hand on 7, long hand on 12: **7 o'clock**. Time to get ready for school!

When the **long hand is on 6**, it is **half past**. The long hand has gone halfway round.
- Short hand between 1 and 2, long hand on 6: **half past 1**.

## Practice
1. Long hand on 12, short hand on 3. What time is it?
2. Long hand on 6, short hand between 10 and 11. What time is it?

*Answers: 3 o'clock, half past 10.*$md$, 'https://www.youtube.com/watch?v=NcIGVn1iAHY', 10, 2),
    (k_time, 'Quarter past and quarter to', 'A quarter of the way round, and a quarter still to go.', $md$# Quarter past and quarter to
Cut the clock face into **four equal parts**, like four slices of a pie.

- Long hand on **3**: **quarter past**. A quarter of the hour has passed.
- Long hand on **9**: **quarter to**. A quarter of the hour is still to go.

## Example
Short hand just after 4, long hand on 3: **quarter past 4**.
Short hand just before 6, long hand on 9: **quarter to 6**.

## Your turn
Draw a clock showing **quarter past 8**, the time your school assembly starts.$md$, null, 10, 3),

    (k_plants, 'Parts of a plant', 'Roots, stem, leaves, flowers, fruits and seeds.', $md$# Parts of a plant
Every flowering plant has the same main parts.

| Part | What it does |
| --- | --- |
| **Roots** | Hold the plant in the soil and take in water |
| **Stem** | Holds the plant up and carries water to the leaves |
| **Leaves** | Make food for the plant using sunlight |
| **Flower** | Makes seeds |
| **Fruit** | Protects the seeds |
| **Seed** | Grows into a new plant |

## Look around
Find a hibiscus or a pawpaw tree near your home. Can you point to each part?$md$, 'https://www.youtube.com/watch?v=A-xScqCN0GA', 10, 1),
    (k_plants, 'What plants need to grow', 'Sunlight, water, air and good soil.', $md$# What plants need
Plants are living things. To grow well they need:

1. **Sunlight** to make food in their leaves
2. **Water**, taken in by the roots
3. **Air**
4. **Good soil** with nutrients

## Experiment
Plant two bean seeds in two cups. Keep one by the window and one in a dark cupboard. Water both. After one week, which plant is taller and greener? Why?$md$, null, 12, 2),
    (k_plants, 'Plants we eat in Nigeria', 'Roots, leaves, fruits and seeds on our plates.', $md$# Plants we eat
We eat different parts of different plants.

- **Roots and tubers:** cassava (garri, fufu), yam, sweet potato
- **Leaves:** ugu, waterleaf, bitter leaf, spinach (efo)
- **Fruits:** orange, mango, pawpaw, tomato, okra
- **Seeds:** rice, maize, beans, groundnut

## Think about it
What did you eat yesterday? Which plant part did each food come from?$md$, null, 10, 3),

    (k_nigeria, 'Nigeria on the map', 'Our states, our capital and our neighbours.', $md$# Nigeria on the map
Nigeria is a country in **West Africa**.

- It has **36 states** and the **Federal Capital Territory (FCT)**.
- Our capital city is **Abuja**.
- Our neighbours are **Benin** (west), **Niger** (north), **Chad** (north-east) and **Cameroon** (east).
- To the south is the **Atlantic Ocean**.

## Activity
Name your state and its capital city. Which states share a border with your state?$md$, null, 12, 1),
    (k_nigeria, 'Our national symbols', 'The flag, the coat of arms and the national anthem.', $md$# Our national symbols
**The flag** is green, white, green.
- **Green** stands for our rich land and farming.
- **White** stands for peace and unity.

**The coat of arms** shows an eagle for strength, two horses for dignity, and the motto *"Unity and Faith, Peace and Progress."*

**The national anthem** is sung at assembly and on special days. We stand still and show respect when it is sung.$md$, null, 10, 2),
    (k_nigeria, 'Many people, one nation', 'Our languages, festivals and how we live together.', $md$# Many people, one nation
Nigeria has more than **250 ethnic groups** and hundreds of languages. The three largest groups are the **Hausa**, the **Igbo** and the **Yoruba**.

We celebrate many festivals, such as the **Argungu Fishing Festival**, the **New Yam Festival** and the **Eyo Festival**.

## Living together
Being a good citizen means respecting people whose language, food or religion is different from ours.

**Discuss:** What is one thing you have learnt from a friend from another part of Nigeria?$md$, null, 12, 3),

    (k_percent, 'What is a percentage?', 'Per cent means "out of a hundred".', $md$# What is a percentage?
**Per cent** means **out of 100**. The sign is **%**.

- 50% means 50 out of 100, which is **half**.
- 25% means 25 out of 100, which is **a quarter**.
- 100% means **all of it**.

## Picture it
Colour 30 squares on a 10 by 10 grid. You have coloured **30%** of the grid.$md$, 'https://www.youtube.com/watch?v=kDFLcCOS7aw', 10, 1),
    (k_percent, 'Fractions, decimals and percentages', 'Three ways to write the same amount.', $md$# Three ways, same amount
| Fraction | Decimal | Percentage |
| --- | --- | --- |
| 1/2 | 0.5 | 50% |
| 1/4 | 0.25 | 25% |
| 3/4 | 0.75 | 75% |
| 1/10 | 0.1 | 10% |

**To change a fraction to a percentage:** make the denominator 100, or multiply by 100.
- 3/5 = 60/100 = **60%**

**To change a decimal to a percentage:** multiply by 100.
- 0.35 × 100 = **35%**$md$, null, 12, 2),
    (k_percent, 'Percentages at the market', 'Discounts, increases and test scores.', $md$# Percentages at the market
**Finding 10%:** divide by 10. 10% of ₦800 = **₦80**.

**A discount:** a ₦2,000 pair of sandals is reduced by 20%.
1. 10% of ₦2,000 = ₦200, so 20% = ₦400.
2. New price = ₦2,000 − ₦400 = **₦1,600**.

**A test score:** 17 out of 20 = 85/100 = **85%**.

## Common Entrance practice
A trader had 60 mangoes and sold 45% of them. How many did she sell? *(Answer: 27)*$md$, null, 15, 3);

  -- Videos inside the courses that moved to Primary
  update public.lessons set video_url = 'https://www.youtube.com/watch?v=TKQIIpZTWPc'
    where course_id = '6c4c0686-c807-45f8-937b-4762d4c0c9ff' and title = 'Equivalent fractions';
  update public.lessons set video_url = 'https://www.youtube.com/watch?v=yAbEYE7QdHk'
    where course_id = '02a8e77c-7097-4ab6-ae47-952226ce251c' and title = 'Counting at home';
  update public.lessons set video_url = 'https://www.youtube.com/watch?v=eV36_j6UEUA'
    where course_id = '0aa78813-562b-4185-a634-e81f24a5f026' and title = 'Nouns and pronouns';
  update public.courses set summary = 'Equivalent fractions, adding and subtracting, and changing fractions to decimals.',
    description = 'A Primary 5 course on fractions with worked examples from the kitchen, the market and the classroom.'
    where id = '6c4c0686-c807-45f8-937b-4762d4c0c9ff';
  update public.courses set summary = 'Nouns, verbs, adjectives and more, with sentences from everyday Nigerian life.'
    where id = '0aa78813-562b-4185-a634-e81f24a5f026';

  -- Question banks ---------------------------------------------------------------------------
  insert into public.question_banks (id, name, description, subject_id, class_id, owner_id, is_shared) values
    (b_frac, 'Primary 5 Mathematics: Fractions', 'Equivalent fractions, simplifying, adding, subtracting and fractions of amounts.', maths, p5, tunde, true),
    (b_eng, 'Primary 4 English: Parts of Speech', 'Nouns, pronouns, verbs, adjectives, adverbs and prepositions.', english, p4, ngozi, true),
    (b_plants, 'Primary 3 Basic Science: Plants', 'Parts of a plant, what plants need and plants we eat.', science, p3, tunde, true),
    (b_pct, 'Primary 6 Mathematics: Percentages', 'Percentages, fractions and decimals, Common Entrance style.', maths, p6, tunde, true);

  perform private.seed_mcq(b_frac, 'Equivalent fractions', 'Which fraction is equal to 1/2?', array['1/3', '2/4', '2/3', '3/5'], 2, 'Multiply the top and bottom of 1/2 by 2 to get 2/4.');
  perform private.seed_mcq(b_frac, 'Equivalent fractions', 'Complete: 3/4 = ?/8', array['3', '4', '6', '8'], 3, '4 × 2 = 8, so multiply the top by 2 as well: 3 × 2 = 6.');
  perform private.seed_mcq(b_frac, 'Equivalent fractions', 'Which fraction is in its simplest form?', array['4/8', '3/5', '6/9', '10/20'], 2, '3 and 5 have no common factor except 1, so 3/5 cannot be simplified.');
  perform private.seed_mcq(b_frac, 'Simplifying fractions', 'Simplify 8/12.', array['4/6', '1/2', '3/4', '2/3'], 4, 'Divide the top and bottom by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3.', 'medium');
  perform private.seed_mcq(b_frac, 'Adding fractions', '2/7 + 3/7 = ?', array['5/7', '5/14', '6/7', '1/7'], 1, 'The denominators are the same, so add the numerators: 2 + 3 = 5.');
  perform private.seed_mcq(b_frac, 'Adding fractions', '1/2 + 1/4 = ?', array['2/6', '1/6', '3/4', '2/4'], 3, '1/2 is the same as 2/4, and 2/4 + 1/4 = 3/4.', 'medium');
  perform private.seed_mcq(b_frac, 'Subtracting fractions', '5/6 − 1/3 = ?', array['4/3', '1/2', '4/6', '1/3'], 2, '1/3 = 2/6, so 5/6 − 2/6 = 3/6, which simplifies to 1/2.', 'medium');
  perform private.seed_mcq(b_frac, 'Fractions of amounts', 'What is 1/4 of ₦200?', array['₦25', '₦40', '₦100', '₦50'], 4, 'To find a quarter, divide by 4: 200 ÷ 4 = 50.');
  perform private.seed_mcq(b_frac, 'Fractions of amounts', 'Mama bought 12 oranges and gave away 2/3 of them. How many did she give away?', array['8', '4', '6', '9'], 1, '1/3 of 12 is 4, so 2/3 of 12 is 8.', 'medium');
  perform private.seed_mcq(b_frac, 'Comparing fractions', 'Which fraction is the biggest?', array['2/3', '1/2', '3/4', '5/8'], 3, 'Change them all to 24ths: 16/24, 12/24, 18/24 and 15/24. 3/4 is the largest.', 'hard');
  perform private.seed_mcq(b_frac, 'Mixed numbers', 'Change 7/2 to a mixed number.', array['2 1/2', '3 1/2', '3 1/7', '7 1/2'], 2, '7 ÷ 2 = 3 remainder 1, so 7/2 = 3 1/2.');
  perform private.seed_mcq(b_frac, 'Fractions and decimals', 'Write 3/10 as a decimal.', array['3.0', '0.03', '0.3', '0.13'], 3, 'Three tenths is written 0.3.');

  perform private.seed_mcq(b_eng, 'Nouns', 'Which word is a noun? "The happy girl ran to school."', array['happy', 'ran', 'school', 'to'], 3, '"School" names a place, so it is a noun.');
  perform private.seed_mcq(b_eng, 'Nouns', 'Which of these is a proper noun?', array['city', 'Kano', 'river', 'teacher'], 2, 'Kano is the name of one particular place, so it is a proper noun and starts with a capital letter.');
  perform private.seed_mcq(b_eng, 'Nouns', 'What is the plural of "baby"?', array['babys', 'babies', 'babyes', 'baby'], 2, 'For words ending in a consonant + y, change the y to i and add -es.');
  perform private.seed_mcq(b_eng, 'Pronouns', 'Choose the pronoun to replace "Tunde": "___ is my brother."', array['He', 'She', 'It', 'They'], 1, 'Tunde is one boy, so we use "He".');
  perform private.seed_mcq(b_eng, 'Verbs', 'Which word is a verb? "Birds sing in the morning."', array['Birds', 'morning', 'sing', 'the'], 3, '"Sing" is the action word, so it is the verb.');
  perform private.seed_mcq(b_eng, 'Verbs', 'Choose the past tense: "Yesterday, we ___ jollof rice."', array['eat', 'eats', 'ate', 'eating'], 3, '"Ate" is the past tense of "eat".');
  perform private.seed_mcq(b_eng, 'Adjectives', 'Which word is an adjective? "She wore a beautiful dress."', array['beautiful', 'wore', 'dress', 'She'], 1, '"Beautiful" describes the dress, so it is an adjective.');
  perform private.seed_mcq(b_eng, 'Adjectives', 'Complete: "An elephant is ___ than a goat."', array['big', 'bigger', 'biggest', 'more big'], 2, 'When we compare two things we use the -er form: bigger.', 'medium');
  perform private.seed_mcq(b_eng, 'Adverbs', 'Which word tells us HOW? "The tortoise walked slowly."', array['tortoise', 'walked', 'slowly', 'The'], 3, '"Slowly" tells us how the tortoise walked, so it is an adverb.', 'medium');
  perform private.seed_mcq(b_eng, 'Prepositions', 'Choose the preposition: "The cat is ___ the table."', array['under', 'quickly', 'happy', 'cat'], 1, '"Under" shows where the cat is, so it is a preposition.');

  perform private.seed_mcq(b_plants, 'Parts of a plant', 'Which part of a plant takes in water from the soil?', array['Leaf', 'Root', 'Flower', 'Fruit'], 2, 'Roots grow into the soil and take in water.');
  perform private.seed_mcq(b_plants, 'Parts of a plant', 'Which part holds the plant up and carries water to the leaves?', array['Stem', 'Seed', 'Petal', 'Fruit'], 1, 'The stem holds the plant up and carries water from the roots to the leaves.');
  perform private.seed_mcq(b_plants, 'Parts of a plant', 'Where does a plant make its food?', array['Root', 'Flower', 'Leaf', 'Seed'], 3, 'Leaves use sunlight, air and water to make food for the plant.');
  perform private.seed_mcq(b_plants, 'Parts of a plant', 'Which part of the plant can grow into a new plant?', array['Seed', 'Leaf', 'Stem', 'Thorn'], 1, 'A seed grows into a new plant when it gets water and warmth.');
  perform private.seed_mcq(b_plants, 'What plants need', 'Which of these does a plant NOT need to grow?', array['Sunlight', 'Water', 'Air', 'Sugar from the shop'], 4, 'Plants make their own food. They need sunlight, water, air and good soil.');
  perform private.seed_mcq(b_plants, 'What plants need', 'A plant kept in a dark cupboard turns yellow. Why?', array['It has no sunlight', 'It has too much water', 'It is too cold', 'It is too old'], 1, 'Without sunlight the leaves cannot make food, so the plant turns pale and weak.', 'medium');
  perform private.seed_mcq(b_plants, 'Plants we eat', 'Garri is made from which part of the cassava plant?', array['Leaf', 'Root', 'Flower', 'Stem'], 2, 'Garri is made from the cassava root (tuber).');
  perform private.seed_mcq(b_plants, 'Plants we eat', 'Which of these is a fruit?', array['Orange', 'Carrot', 'Ugu leaf', 'Yam'], 1, 'An orange grows from a flower and holds seeds, so it is a fruit.');

  perform private.seed_mcq(b_pct, 'Percentages', 'What does 50% mean?', array['Half', 'A quarter', 'A tenth', 'All of it'], 1, '50% is 50 out of 100, which is one half.');
  perform private.seed_mcq(b_pct, 'Percentages', 'Write 1/4 as a percentage.', array['40%', '25%', '14%', '75%'], 2, '1/4 = 25/100 = 25%.');
  perform private.seed_mcq(b_pct, 'Percentages of amounts', 'Find 10% of ₦500.', array['₦5', '₦10', '₦50', '₦100'], 3, 'To find 10%, divide by 10: 500 ÷ 10 = 50.');
  perform private.seed_mcq(b_pct, 'Decimals and percentages', 'Write 0.6 as a percentage.', array['6%', '60%', '0.6%', '600%'], 2, 'Multiply by 100: 0.6 × 100 = 60%.');
  perform private.seed_mcq(b_pct, 'Percentages', 'A pupil scored 18 out of 20. What percentage is that?', array['80%', '85%', '90%', '95%'], 3, '18/20 = 90/100 = 90%.', 'medium');
  perform private.seed_mcq(b_pct, 'Percentages of amounts', 'A ₦1,000 bag is reduced by 20%. What is the new price?', array['₦800', '₦980', '₦200', '₦1,200'], 1, '20% of ₦1,000 is ₦200, and ₦1,000 − ₦200 = ₦800.', 'medium');
  perform private.seed_mcq(b_pct, 'Comparing', 'Which is the largest?', array['0.45', '40%', '1/2', '3/10'], 3, 'As percentages: 45%, 40%, 50% and 30%. 1/2 (50%) is the largest.', 'hard');
  perform private.seed_mcq(b_pct, 'Percentages of amounts', 'In a class of 40 pupils, 25% are boys. How many boys are there?', array['25', '10', '15', '4'], 2, '25% is a quarter, and a quarter of 40 is 10.', 'medium');

  -- Tests ------------------------------------------------------------------------------------
  insert into public.examinations (id, title, description, instructions, exam_type, subject_id, class_id, classroom_id, created_by,
                                   duration_minutes, pass_mark, max_attempts, available_from, available_until, is_published) values
    (x_frac, 'Primary 5 Maths Test 1: Fractions', 'Ten questions on everything we have covered in fractions so far.',
     'Read each question carefully. You have 15 minutes. Your result appears as soon as you submit.', 'test', maths, p5, c_p5m, tunde,
     15, 50, 1, now() - interval '1 day', now() + interval '14 days', true),
    (x_quiz, 'Primary 5 Quick Quiz: Equivalent Fractions', 'A five-question warm-up.', 'Answer all five questions.', 'test', maths, p5, c_p5m, tunde,
     8, 50, 1, now() - interval '6 days', now() + interval '7 days', true),
    (x_sci, 'Primary 5 Science Check: Plants', 'Six questions on the parts of a plant and what plants need.', 'Answer all six questions.', 'test', science, p5, c_p5s, tunde,
     10, 50, 1, now() - interval '5 days', now() + interval '7 days', true),
    (x_pct, 'Primary 6 Maths Quiz: Percentages', 'Eight Common Entrance style questions on percentages.', 'You have 12 minutes. Show your working on paper.', 'test', maths, p6, c_p6m, tunde,
     12, 50, 1, now() - interval '4 days', now() + interval '10 days', true);
  perform private.seed_exam_questions(x_frac, b_frac, array[1, 2, 4, 5, 6, 7, 8, 9, 10, 12]);
  perform private.seed_exam_questions(x_quiz, b_frac, array[1, 2, 3, 4, 11]);
  perform private.seed_exam_questions(x_sci, b_plants, array[1, 2, 3, 4, 5, 6]);
  perform private.seed_exam_questions(x_pct, b_pct, array[1, 2, 3, 4, 5, 6, 7, 8]);

  perform private.seed_attempt(x_quiz, amina, array[true, true, true, false, true], now() - interval '3 days 6 hours');
  perform private.seed_attempt(x_sci, amina, array[true, true, true, true, false, true], now() - interval '2 days 7 hours');
  perform private.seed_attempt(x_pct, chidi, array[true, true, false, true, true, false, true, false], now() - interval '2 days 5 hours');
  perform private.seed_attempt(x_pct, emeka, array[true, true, true, true, true, true, false, true], now() - interval '2 days 4 hours');

  -- Assignments, live classes and announcements (these notify the class) -------------------------
  insert into public.assignments (classroom_id, teacher_id, title, description, instructions, total_marks, due_at, accepted_file_types) values
    (c_p5m, tunde, 'Fractions in the kitchen', 'Find fractions in the food you eat at home.',
     'Ask an adult to help you share a loaf of bread, an orange or a pot of rice into equal parts. Take a photo or draw it, then write the fraction each person got. Upload your photo or drawing with three sentences.',
     20, now() + interval '5 days', '{pdf,docx,jpg,jpeg,png}'),
    (c_p5s, tunde, 'Draw and label a flower', 'Draw a hibiscus or any flower near your home.',
     'Draw the flower big and clear. Label the petals, stem, leaf and roots (draw the roots under the soil line). Upload a photo of your drawing.',
     10, now() + interval '6 days', '{pdf,jpg,jpeg,png}'),
    (c_p6m, tunde, 'Market maths: percentages', 'Use percentages to solve real shopping problems.',
     'Visit a shop or market with an adult. Write down the prices of five items. Work out the new price of each item after a 10% discount and a 25% discount. Upload your working.',
     20, now() + interval '4 days', '{pdf,docx,jpg,jpeg,png}');

  update public.live_classes set starts_at = date_trunc('day', now()) + interval '2 days 14 hours', status = 'scheduled'
    where id = '35f31930-8db5-4a78-951a-48fe3f250ea5';
  insert into public.live_classes (classroom_id, teacher_id, title, description, starts_at, duration_minutes) values
    (c_p5m, tunde, 'Fractions with pizza', 'We will cut paper pizzas into halves, quarters and eighths. Have a sheet of paper and scissors ready.',
     date_trunc('day', now()) + interval '1 day 15 hours', 45),
    (c_p5s, tunde, 'Plants around our school', 'A live walk-through of the plants in our school garden. Bring one leaf to show the class.',
     date_trunc('day', now()) + interval '3 days 10 hours', 40),
    (c_p6m, tunde, 'Common Entrance clinic: percentages', 'We will solve ten past-style questions together. Bring your questions.',
     date_trunc('day', now()) + interval '2 days 15 hours', 60);

  insert into public.announcements (classroom_id, author_id, title, body, created_at) values
    (c_p5m, tunde, 'Welcome to Primary 5 Mathematics!', 'This term we are learning fractions, decimals and measurement. Watch the class videos before each live class, and try the practice quizzes as often as you like.', now() - interval '9 days'),
    (c_p5m, tunde, 'Test 1 is open', 'Test 1 on fractions is now open. You have 15 minutes and one attempt. Good luck!', now() - interval '20 hours'),
    (c_p6m, tunde, 'Common Entrance practice starts', 'Every week we will do one Common Entrance style quiz. This week: percentages.', now() - interval '6 days');

  -- Class videos (YouTube) for every Primary class (these notify each class) ----------------------
  insert into public.class_videos (class_id, subject_id, title, description, source, youtube_id, uploaded_by, created_at) values
    (p1, maths, 'Learn numbers up to 20', 'Count from 1 to 20 and spot the numbers all around you.', 'youtube', 'yAbEYE7QdHk', ngozi, now() - interval '6 days'),
    (p1, maths, 'Count to 20 and work out', 'Stand up, count and move! A fun counting exercise.', 'youtube', '_MVzXKfr6e8', ngozi, now() - interval '2 days'),
    (p2, maths, 'Telling the time: o''clock and half past', 'The parts of a clock, and how to read o''clock and half past.', 'youtube', 'NcIGVn1iAHY', ngozi, now() - interval '4 days'),
    (p3, science, 'Parts of a plant', 'Roots, stem, leaves, flowers and seeds, and what each one does.', 'youtube', 'A-xScqCN0GA', tunde, now() - interval '5 days'),
    (p4, english, 'Let''s learn about nouns', 'What a noun is, and how to sort nouns into people, places and things.', 'youtube', 'eV36_j6UEUA', ngozi, now() - interval '5 days'),
    (p4, english, 'Nouns and verbs explained', 'Naming words and doing words, with simple examples.', 'youtube', 'banUlDVkTMA', ngozi, now() - interval '1 day'),
    (p5, maths, 'What are equivalent fractions?', 'Watch before Test 1. Fractions that look different but are the same amount.', 'youtube', 'TKQIIpZTWPc', tunde, now() - interval '7 days'),
    (p5, maths, 'Equivalent fractions, step by step', 'How to find equivalent fractions by multiplying and dividing.', 'youtube', 'yeeQekyrfa0', tunde, now() - interval '3 days'),
    (p5, science, 'Parts of a plant and their functions', 'Watch before our live class on plants around our school.', 'youtube', 'FBJ9iAcfeAU', tunde, now() - interval '20 hours'),
    (p6, maths, 'Percentages for kids', 'What a percentage is and how to work one out.', 'youtube', 'kDFLcCOS7aw', tunde, now() - interval '6 days'),
    (p6, maths, 'What are percentages?', 'A real-life example: finding 40% of 120.', 'youtube', 'ty12FGhxQEw', tunde, now() - interval '2 days');
  -- Some views so teachers see engagement
  update public.class_videos set view_count = v.n from (values ('yAbEYE7QdHk', 14), ('NcIGVn1iAHY', 9), ('A-xScqCN0GA', 11), ('eV36_j6UEUA', 17),
    ('TKQIIpZTWPc', 23), ('yeeQekyrfa0', 12), ('kDFLcCOS7aw', 19), ('ty12FGhxQEw', 6), ('banUlDVkTMA', 4), ('_MVzXKfr6e8', 3)) as v(id, n)
    where youtube_id = v.id;

  -- Give the alerts realistic times: older ones are read, the newest stay unread.
  update public.notifications n set created_at = v.created_at, is_read = v.created_at < now() - interval '1 day'
  from public.class_videos v where n.link = '/student/videos/' || v.id;
  update public.notifications set is_read = true where created_at < now() - interval '2 days';
end $$;

drop function private.seed_mcq(uuid, text, text, text[], int, text, text);
drop function private.seed_exam_questions(uuid, uuid, int[]);
drop function private.seed_attempt(uuid, uuid, boolean[], timestamptz);
