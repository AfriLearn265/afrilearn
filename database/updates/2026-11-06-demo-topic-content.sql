-- =====================================================================
-- AfriLearn demo: lesson notes and quizzes for a few first-term topics,
-- so the topic page (video, notes, quiz) can be shown end to end.
-- Run after 2026-11-06-curriculum-topics.sql.
-- =====================================================================

drop table if exists demo_topic;
create temporary table demo_topic (cls text, subj text, title text, summary text, notes text);
insert into demo_topic values
('P1','mathematics','Whole numbers 1 to 5','Count, read and write the numbers 1, 2, 3, 4 and 5.',
$n$## Let's count!

We use numbers to say **how many** things there are.

- **1** one: one sun in the sky
- **2** two: two eyes on your face
- **3** three: three legs on a stool
- **4** four: four legs on a goat
- **5** five: five fingers on one hand

## Try it

1. Hold up one hand. Count your fingers: 1, 2, 3, 4, 5.
2. Find 3 pencils in your bag. Put them in a line and count them.
3. Write the numbers 1 to 5 in your book. Say each one out loud.

> Tip: when you count, touch each thing once. Don't skip any, and don't count any twice.$n$),

('P1','english','Phonics','Learn the sounds that letters make, and blend them to read short words.',
$n$## Letters make sounds

Every letter has a name and a **sound**. The letter **m** is called "em", but it says *mmm*.

| Letter | Sound | Word |
|---|---|---|
| a | /a/ | ant |
| b | /b/ | bag |
| c | /k/ | cat |
| m | /m/ | mat |
| s | /s/ | sun |
| t | /t/ | tin |

## Blending

Say the sounds one after another, then push them together:

- c ... a ... t → **cat**
- s ... a ... t → **sat**
- m ... a ... t → **mat**

## Try it

Point to things at home that start with /s/: sun, sock, soap, spoon.$n$),

('P5','mathematics','Whole numbers','Read, write and compare whole numbers up to millions using place value.',
$n$## Place value

The place of a digit tells us its value. In **4,725,318**:

- 4 is **4 millions** (4,000,000)
- 7 is 7 hundred thousands (700,000)
- 2 is 2 ten thousands (20,000)
- 5 is 5 thousands (5,000)
- 3 is 3 hundreds, 1 is 1 ten, 8 is 8 units

So we read it as *four million, seven hundred and twenty-five thousand, three hundred and eighteen*.

## Comparing numbers

Start from the **left**. The first place where the digits are different decides which number is bigger.

- 52,**8**14 and 52,**3**99 → 8 thousands is more than 3 thousands, so **52,814 > 52,399**.

## Rounding

To round to the nearest thousand, look at the hundreds digit. If it is 5 or more, round up.

- 36,**7**40 → 37,000
- 36,**2**40 → 36,000$n$),

('P5','mathematics','Fractions','Understand proper, improper and equivalent fractions, and simplify fractions.',
$n$## What is a fraction?

A fraction is a **part of a whole**. In ³⁄₄, the bottom number (the **denominator**) says how many equal parts the whole is cut into. The top number (the **numerator**) says how many parts we have.

## Kinds of fractions

- **Proper**: top is smaller than bottom, like ²⁄₅
- **Improper**: top is bigger, like ⁷⁄₄
- **Mixed number**: a whole number and a fraction, like 1¾ (which equals ⁷⁄₄)

## Equivalent fractions

Multiply or divide the top and bottom by the **same** number and the fraction keeps its value:

- ½ = ²⁄₄ = ³⁄₆ = ⁴⁄₈

## Simplifying

Divide top and bottom by their highest common factor:

- ⁶⁄₉ → divide both by 3 → **²⁄₃**

> Mama cuts an orange into 8 equal pieces and you eat 4. You ate ⁴⁄₈ of the orange, which is the same as ½.$n$),

('P5','mathematics','Money','Add, subtract and solve word problems with naira and kobo.',
$n$## Naira and kobo

**₦1 = 100 kobo.** We write ₦25.50 for twenty-five naira, fifty kobo.

## Adding and subtracting money

Line up the decimal points, then add or subtract as usual.

```
  ₦1,250.50
+ ₦  375.25
-----------
  ₦1,625.75
```

## Word problem

Ada buys bread for ₦850 and milk for ₦1,200. She pays with ₦5,000. How much change does she get?

1. Total cost: ₦850 + ₦1,200 = ₦2,050
2. Change: ₦5,000 − ₦2,050 = **₦2,950**

> Always check your change by adding it back: ₦2,050 + ₦2,950 = ₦5,000.$n$),

('P5','english','Phonics','Hear and spell long vowel sounds and common letter teams.',
$n$## Long vowel sounds

A long vowel "says its name". Often two letters work together as a **team** to make it.

| Sound | Letter teams | Examples |
|---|---|---|
| long a | ai, ay, a_e | rain, play, cake |
| long e | ee, ea | tree, beach |
| long i | igh, ie, i_e | night, pie, kite |
| long o | oa, ow, o_e | boat, snow, home |
| long u | ue, ew, u_e | blue, new, flute |

## The magic e

An **e** at the end of a word makes the vowel before it long:

- cap → **cape**, kit → **kite**, hop → **hope**

## Try it

Read these aloud and sort them by their long vowel: *train, feet, light, road, glue, day, seat, bike*.$n$),

('P5','english','Guided formal letter writing','Write a formal letter with the right layout, tone and parts.',
$n$## When do we write a formal letter?

To people we don't know personally, or to people in their official role: a head teacher, a council chairman, a company.

## The parts of a formal letter

1. **Your address** and the **date**, at the top right
2. **The receiver's title and address**, on the left, below yours
3. **Salutation**: *Dear Sir,* or *Dear Madam,*
4. **Heading**, underlined: what the letter is about
5. **Body**: short paragraphs. Say why you are writing, give details, say what you want
6. **Closing**: *Yours faithfully,* then your signature and full name

## Tone

Be polite and clear. Don't use slang, jokes or short forms like "pls".

> Practice: write to your head teacher asking for a school football field to be repaired.$n$),

('P5','english','Direct and indirect speech','Turn the exact words people say into reported speech.',
$n$## Direct speech

We write the **exact words** inside quotation marks:

- Tolu said, **"I am hungry."**

## Indirect (reported) speech

We report what was said, **without** quotation marks, and the tense usually moves one step back:

- Tolu said **that he was hungry**.

## What changes

| Direct | Indirect |
|---|---|
| am / is | was |
| are | were |
| will | would |
| can | could |
| I / my | he, she / his, her |
| today | that day |
| tomorrow | the next day |

## Examples

- "I will come tomorrow," Ada said. → Ada said that she would come the next day.
- "We can play now," the boys said. → The boys said that they could play then.$n$),

('P6','mathematics','Whole numbers','Read, write and round large whole numbers, and work with place value.',
$n$## Big numbers

Group digits in threes from the right: **12,450,600,000** is *twelve billion, four hundred and fifty million, six hundred thousand*.

- 1 thousand = 1,000
- 1 million = 1,000,000 (a thousand thousands)
- 1 billion = 1,000,000,000 (a thousand millions)

## Rounding large numbers

- 7,**4**82,000 to the nearest million → 7,000,000
- 7,**6**82,000 to the nearest million → 8,000,000

## Using big numbers

Nigeria's population is often written in millions. If a state has 6,725,000 people, we can say *about 6.7 million*.

> Check: read your number aloud. If it sounds wrong, count the groups of three again.$n$),

('P6','english','Writing paragraphs: introduction, middle and conclusion','Plan and write an essay with a clear beginning, middle and end.',
$n$## Three kinds of paragraph

1. **Introduction**: tell the reader what the essay is about. One or two sentences can be enough.
2. **Body (middle)**: each paragraph gives **one main idea** with details or examples.
3. **Conclusion**: sum up and end with a final thought.

## The topic sentence

Start each body paragraph with a sentence that tells its main idea. Then support it.

*Market days in my town are busy.* (topic sentence) *Traders arrive before sunrise, and by noon the road is full of buyers and sellers.* (detail)

## Linking words

Use them to move smoothly between ideas: *firstly, also, however, for example, finally, in conclusion*.

> Practice: write three paragraphs on "My best day at school".$n$);

update public.curriculum_topics t set summary = d.summary, notes = d.notes
from demo_topic d join public.classes c on c.code = d.cls join public.subjects s on s.code = d.subj
where t.class_id = c.id and t.subject_id = s.id and t.title = d.title and t.notes is null;

drop table if exists demo_q;
create temporary table demo_q (cls text, subj text, title text, n int, prompt text, options text[], answer int, explanation text);
insert into demo_q values
('P1','mathematics','Whole numbers 1 to 5',1,'How many fingers are on one hand?',array['3','4','5'],2,'Count them: 1, 2, 3, 4, 5.'),
('P1','mathematics','Whole numbers 1 to 5',2,'Which number comes after 3?',array['2','4','5'],1,'1, 2, 3, then 4.'),
('P1','mathematics','Whole numbers 1 to 5',3,'A goat has how many legs?',array['2','4','5'],1,'A goat walks on four legs.'),
('P1','english','Phonics',1,'Which word starts with the /s/ sound?',array['sun','mat','bag'],0,'Sun starts with s, which says /s/.'),
('P1','english','Phonics',2,'Blend the sounds c-a-t. What word do you get?',array['cut','cat','cot'],1,'c ... a ... t makes cat.'),
('P1','english','Phonics',3,'What sound does the letter m make?',array['/mmm/','/sss/','/t/'],0,'The letter m says /mmm/.'),
('P5','mathematics','Whole numbers',1,'What is the value of the digit 7 in 4,725,318?',array['7,000','70,000','700,000','7,000,000'],2,'7 is in the hundred thousands place, so it is 700,000.'),
('P5','mathematics','Whole numbers',2,'Which number is bigger?',array['52,399','52,814'],1,'Both start 52, then 8 thousands beats 3 thousands.'),
('P5','mathematics','Whole numbers',3,'Round 36,740 to the nearest thousand.',array['36,000','36,700','37,000'],2,'The hundreds digit is 7 (5 or more), so round up to 37,000.'),
('P5','mathematics','Whole numbers',4,'How do we write "two million, fifty thousand"?',array['2,050,000','2,500,000','250,000'],0,'2 millions and 50 thousands: 2,050,000.'),
('P5','mathematics','Fractions',1,'Which fraction is equal to ½?',array['²⁄₃','³⁄₆','³⁄₄'],1,'3 is half of 6, so ³⁄₆ = ½.'),
('P5','mathematics','Fractions',2,'Simplify ⁶⁄₉.',array['²⁄₃','³⁄₄','⅓'],0,'Divide top and bottom by 3: ⁶⁄₉ = ²⁄₃.'),
('P5','mathematics','Fractions',3,'Which of these is an improper fraction?',array['²⁄₅','⁷⁄₄','1¾'],1,'In ⁷⁄₄ the top is bigger than the bottom.'),
('P5','mathematics','Fractions',4,'An orange is cut into 8 equal pieces and you eat 2. What fraction did you eat?',array['²⁄₆','¼','⅛'],1,'²⁄₈ simplifies to ¼.'),
('P5','mathematics','Money',1,'How many kobo make ₦1?',array['10','100','1,000'],1,'₦1 = 100 kobo.'),
('P5','mathematics','Money',2,'₦1,250.50 + ₦375.25 = ?',array['₦1,625.75','₦1,525.75','₦1,625.25'],0,'Line up the points and add: ₦1,625.75.'),
('P5','mathematics','Money',3,'Ada spends ₦2,050 and pays with ₦5,000. What is her change?',array['₦3,050','₦2,950','₦2,050'],1,'₦5,000 − ₦2,050 = ₦2,950.'),
('P5','english','Phonics',1,'Which word has a long a sound?',array['cat','rain','hat'],1,'In rain, the team ai says long a.'),
('P5','english','Phonics',2,'Add a magic e to "kit". What word do you get?',array['kitten','kite','kits'],1,'The e makes the i long: kite.'),
('P5','english','Phonics',3,'Which letter team spells the long o in "boat"?',array['oa','ow','oo'],0,'b-oa-t: the team oa says long o.'),
('P5','english','Guided formal letter writing',1,'How should a formal letter to your head teacher end?',array['Your friend,','Yours faithfully,','Bye for now,'],1,'Formal letters that begin "Dear Sir" end with "Yours faithfully".'),
('P5','english','Guided formal letter writing',2,'Where does the heading of a formal letter go?',array['After the salutation','At the very end','Before your address'],0,'The heading comes after "Dear Sir," and is underlined.'),
('P5','english','Guided formal letter writing',3,'Which sentence suits a formal letter?',array['Pls fix the field ASAP.','I write to request that the field be repaired.','Hey, the field is bad lol.'],1,'Formal letters are polite and clear, with no slang or short forms.'),
('P5','english','Direct and indirect speech',1,'"I am hungry," said Tolu. In indirect speech:',array['Tolu said that he is hungry.','Tolu said that he was hungry.','Tolu said, I was hungry.'],1,'am moves back to was, and I becomes he.'),
('P5','english','Direct and indirect speech',2,'In indirect speech, "tomorrow" usually becomes:',array['the next day','yesterday','today'],0,'Time words shift: tomorrow becomes the next day.'),
('P5','english','Direct and indirect speech',3,'"We can play now," the boys said. Indirect speech:',array['The boys said that they could play then.','The boys said we can play now.','The boys said that they can play now.'],0,'can becomes could, we becomes they, now becomes then.'),
('P6','mathematics','Whole numbers',1,'How many zeros are in one billion?',array['6','9','12'],1,'1,000,000,000 has nine zeros.'),
('P6','mathematics','Whole numbers',2,'Round 7,682,000 to the nearest million.',array['7,000,000','7,700,000','8,000,000'],2,'The hundred-thousands digit is 6, so round up to 8,000,000.'),
('P6','mathematics','Whole numbers',3,'6,725,000 is about:',array['6.7 million','67 million','0.67 million'],0,'6,725,000 is a little more than 6.7 million.'),
('P6','english','Writing paragraphs: introduction, middle and conclusion',1,'What should each body paragraph have?',array['One main idea','Every idea in the essay','Only a conclusion'],0,'Each body paragraph develops one main idea.'),
('P6','english','Writing paragraphs: introduction, middle and conclusion',2,'Which is a linking word?',array['however','market','bright'],0,'However links two ideas that contrast.'),
('P6','english','Writing paragraphs: introduction, middle and conclusion',3,'The sentence that states a paragraph''s main idea is called the:',array['topic sentence','closing line','salutation'],0,'The topic sentence usually opens the paragraph.');

insert into public.topic_questions (topic_id, prompt, options, answer, explanation, sort_order)
select t.id, q.prompt, q.options, q.answer, q.explanation, q.n
from demo_q q
join public.classes c on c.code = q.cls join public.subjects s on s.code = q.subj
join public.curriculum_topics t on t.class_id = c.id and t.subject_id = s.id and t.title = q.title
where not exists (select 1 from public.topic_questions x where x.topic_id = t.id);

drop table if exists demo_topic;
drop table if exists demo_q;
