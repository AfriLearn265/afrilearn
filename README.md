# AfriLearn

**Learning Without Limits.** A learning platform for Nigerian primary schools, Primary 1 to Primary 6, for pupils, teachers, parents and administrators: class videos, lessons, quizzes that mark themselves, live classes and progress reports.

> **Primary edition (November 2026).** The first edition covered Nursery 1 to SS 3 and WAEC/NECO/JAMB preparation. That version is kept on the `backup-full-platform` branch. In the database the other classes are switched off, not deleted, and every table changed by the switch was copied to the private `archive` schema first.

> "AfriLearn" is a temporary brand. Change the name, tagline and contact email in `src/config/brand.ts` (and the `brand` row in `platform_settings`).

## Stack

| Layer | Choice |
| --- | --- |
| Web app | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4, self-hosted Bricolage Grotesque and Figtree fonts |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security |
| Hosting | Vercel |
| Code | GitHub |

## Project structure

```
database/            SQL to create the whole backend, run in this order:
  schema.sql         tables, indexes, triggers
  functions.sql      access helpers, sign-up trigger, secure RPCs (exams, grading, payments)
  policies.sql       privileges, Row Level Security, storage buckets and rules
  seed.sql           levels, classes, subjects, subject-to-class map, plans, badges, settings
  updates/           run after the four files above, oldest first:
    2026-11-05-primary-and-videos.sql    Primary-only switch, class videos table, bucket and rules
    2026-11-05-primary-demo-content.sql  demo classrooms, courses, quizzes, results and videos
    2026-11-06-curriculum-topics.sql     topics by term (English, Maths, P1-6), quizzes, progress, DRM video columns
    2026-11-06-demo-topic-content.sql    demo notes and quizzes for a few first-term topics
    2026-11-07-ratings-and-highlights.sql lesson star ratings and the homepage's real numbers
src/
  app/               routes: landing, (auth), student, teacher, parent, admin, pending ...
  components/        landing sections, app shell, UI kit
  config/            brand, curriculum fallback, navigation
  lib/               Supabase clients, auth guard, catalogue, formatting
  proxy.ts           refreshes sessions and keeps signed-out users out of dashboards
```

## How security works

* **Every table has Row Level Security.** A student only reads their own records, a teacher only students in their classrooms, a parent only linked children. Changing a URL or browser data cannot widen access.
* **Roles are set by the database.** Sign-up can only create student, parent or teacher (pending) accounts. Only an administrator can approve teachers or change roles, through logged RPCs.
* **Students never receive answer keys.** Questions reach students only through exam RPCs. Marking, deadlines, late flags, points and results are computed inside Postgres.
* **Payments** are confirmed by a server-only function after the provider verifies them.
* **Children:** Nursery and Primary sign-ups require guardian consent; there is no adult-to-child private messaging; leaderboards are opt-in and show first names only.

## Run locally

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL and publishable key
npm run dev                     # http://localhost:3000
```

## Connect Supabase (new project)

1. Create a project at supabase.com.
2. In **SQL Editor**, run `database/schema.sql`, `functions.sql`, `policies.sql`, then `seed.sql`, then the files in `database/updates/` (oldest first).
3. **Authentication → Sign In / Providers → Email:** for a demo without custom email, turn off **Confirm email**. For production, add custom SMTP (for example Resend) and keep it on.
4. **Authentication → URL Configuration:** set the Site URL to your Vercel address and add `https://YOUR-SITE/auth/callback` to the redirect URLs.
5. Copy the Project URL and publishable key into `.env.local` and Vercel.

### Make the first administrator

Sign up normally, then in the SQL Editor run:

```sql
update public.profiles set role = 'admin', status = 'active'
where id = (select id from auth.users where email = 'you@example.com');
```

## Deploy to Vercel

1. Import the GitHub repository in Vercel (framework: Next.js, defaults are fine).
2. Add the environment variables from `.env.example` (at least the two `NEXT_PUBLIC_SUPABASE_*` values and `NEXT_PUBLIC_SITE_URL`).
3. Deploy. Every push to `main` redeploys automatically.

> Free tiers: Supabase pauses free projects after 7 days without activity, so open the site the day before a demo. Vercel's free Hobby plan is for non-commercial use; move to Pro before taking real payments.

## Upload to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USER/afrilearn.git
git push -u origin main
```

## Integrations that need your keys

| Feature | What to add | Without it |
| --- | --- | --- |
| Parent-created child accounts, Paystack webhook | `SUPABASE_SECRET_KEY` | Those two actions explain they are not configured |
| AI learning companion | `ANTHROPIC_API_KEY` | Companion shows a "not configured" message |
| Payments | `PAYSTACK_SECRET_KEY` (test key for the pilot) | Pricing stays informational; pilot mode keeps every feature free |
| Live classes | `JAAS_APP_ID`, `JAAS_API_KEY_ID`, `JAAS_PRIVATE_KEY` | Falls back to public Jitsi, which limits embedded calls to 5 minutes |
| Protected (DRM) videos | `VDOCIPHER_API_SECRET`, optional `VDOCIPHER_FOLDER_ID` | Uploads go to private Supabase storage and play through a 20-minute link |

## Development phases

1. Architecture, design system, landing page, authentication, database ✅
2. Student, teacher, parent and administrator dashboards ✅
3. Classrooms, courses, lessons, materials, assignments ✅
4. Examination engine, CBT centre, results and grading ✅
5. Live classroom, AI companion, notifications, gamification ✅
6. Payments, security review, performance, deployment notes ✅

## Free downloads

The public **Free downloads** page (`/resources`) lists every library item an administrator marks for the public. The ten starter PDFs in `public/resources` are original AfriLearn material: practice papers in JAMB, WAEC and Common Entrance style (with answers and explanations), lesson notes, worksheets and a sample scheme of work. Real past papers belong to the exam bodies, so they are not copied here.

To rebuild the PDFs after editing `scripts/resources/content.py`:

```bash
pip install reportlab fonttools
python3 scripts/resources/build.py public/resources
```

## Builder console (administrators)

- **Overview** shows every class with its students, active learners this week, teachers, classrooms and courses, plus what is happening right now (live classes and recent activity).
- **Settings → Brand and website** changes the site name, tagline, support email and logo, and switches a banner on or off at the top of the public site. Changes appear across the site straight away.

## Demo accounts (pilot project only)

The hosted pilot database contains demo accounts so every role can be shown without signing up. They all use the password `AfriLearn@2026`. Change or delete them before real users join.

| Role | Email | What to show |
| --- | --- | --- |
| Administrator | admin@demo.afrilearn.ng | Overview charts, approve Grace's teacher application, users, settings |
| Teacher | teacher@demo.afrilearn.ng | Tunde Bakare: SS1 Mathematics (join code `MATHS1`), Test 1, an essay waiting to be marked, a late assignment to grade |
| Teacher | teacher2@demo.afrilearn.ng | Ngozi Eze: JSS2 English, SS1 Biology, Primary 4 Reading Club, a parent message to answer |
| Teacher applicant | applicant@demo.afrilearn.ng | Grace Adebayo: sees the "application under review" page until an admin approves her |
| Student (SS1) | student@demo.afrilearn.ng | Amina Yusuf: Learning Journey, 9-day streak, 85% on Test 1, a certificate, CBT practice |
| Student (SS1) | chidi@demo.afrilearn.ng | Chidi Okonkwo: catching up, test result waiting for essay marking |
| Student (JSS2) | fatima@demo.afrilearn.ng | Fatima Bello: finished Parts of Speech |
| Pupil (Primary 4) | tobi@demo.afrilearn.ng | Tobi Adeyemi: account managed by his father |
| JAMB candidate | emeka@demo.afrilearn.ng | Emeka Nwosu: mocks and practice in the CBT Centre |
| Parent | parent@demo.afrilearn.ng | Halima Yusuf: Amina's results, attendance and a conversation with her teacher |
| Parent | parent2@demo.afrilearn.ng | Kunle Adeyemi: Tobi's progress |

All lessons and exam questions in the demo are original. The library links to openly licensed OpenStax textbooks.

## Class videos

Teachers and administrators add videos from **Class videos** in their dashboard. Each video belongs to one class, and usually to one topic, so pupils find it on that topic's page. Only pupils in that class, their parents, and staff can watch it.

* **Protected hosting (VdoCipher):** with `VDOCIPHER_API_SECRET` set, the teacher's browser sends the file straight to VdoCipher, which encrypts it (Widevine and FairPlay DRM). Each play gets a five-minute one-time pass from the server and shows the pupil's name drifting across the picture. The video can't be downloaded, and a link copied from the browser's developer tools plays nowhere else. VdoCipher's Android and iOS SDKs add screen-recording blocking and encrypted offline downloads for the future app.
* **Until then:** uploads go to private Supabase storage (up to 50 MB a file on the free plan) and play through a link that expires after 20 minutes, with no download button, no picture-in-picture, no right-click menu and the same moving name watermark. A determined person can still capture this, which is why DRM hosting is recommended.
* YouTube links are no longer accepted for new videos, because YouTube videos can be downloaded. The early sample videos still play through YouTube's privacy-enhanced player until real lessons replace them.

Pupils in the class get a notification for each new video, and teachers see a view count and who has watched.

## Topics by term

Each class has its English, Mathematics and Basic Science topics split into first, second and third term (**Topics by term** for administrators, **Topics and notes** for teachers). Each topic page has three parts: **Watch** (its video), **Notes** (simple formatting: `##` headings, `-` lists, `**bold**`, `| a | b |` tables) and **Quiz** (checked on the server, so answers never reach the pupil's browser; 50% or more marks the topic done and earns stars). Topic links use a short random code, so the address never spells out the class or topic.

## Pupil accounts without email

Young pupils often have no email address, so parents and the school can create accounts for them:

* **Parents:** *Add a child* on the parent dashboard creates the pupil, links them to the parent, and shows a printable login card.
* **School administrators:** *Add pupils* creates a whole class at once from names pasted out of a spreadsheet (optionally with each parent's name and email), puts them in a classroom if you choose one, and prints a login card for each pupil.

Each pupil gets a login ID such as `amina.y482` and an easy password such as `mango-rocket-47`. They sign in on the normal login page by typing the login ID instead of an email. Behind the scenes the ID maps to an internal address on `pupils.afrilearn.ng`; no email is ever sent there. This needs `SUPABASE_SECRET_KEY` on the server.

Pupils can also pick a cartoon animal as their picture instead of uploading a photo.
