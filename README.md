# AfriLearn

**Learning Without Limits.** A learning platform for the Nigerian school system: Nursery 1 to SS3 plus WAEC, NECO, JAMB, NABTEB and scholarship preparation, for students, teachers, parents and administrators.

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
2. In **SQL Editor**, run `database/schema.sql`, `functions.sql`, `policies.sql`, then `seed.sql`.
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

## Development phases

1. Architecture, design system, landing page, authentication, database ✅
2. Student, teacher, parent and administrator dashboards ✅
3. Classrooms, courses, lessons, materials, assignments ✅
4. Examination engine, CBT centre, results and grading ✅
5. Live classroom, AI companion, notifications, gamification ✅
6. Payments, security review, performance, deployment notes ✅

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
