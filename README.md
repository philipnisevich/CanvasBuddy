# CanvasBuddy

A student dashboard that connects to Canvas and helps you stay on top of schoolwork:

- **Home** — customizable widget board (grades, GPA, due tomorrow, upcoming preview, missing work, AI shortcut, and more)
- **Grades** — scores and letter grades for active courses, plus unweighted/weighted GPA estimates
- **Upcoming** — what’s due tomorrow and a configurable day-by-day horizon
- **Missing** — assignments marked missing, overdue without submission, or scored zero
- **AI** — study helper that searches your Canvas courses (syllabus, announcements, modules, assignments, and more) to answer questions (powered by Claude)

## For students

1. **Create an account** or sign in at `/login` (email and password).
2. Open **Settings** → **Canvas** and add your school **Canvas URL** and a **personal access token**.
3. Optionally open **Settings** → **GPA** to set scale and weighting for GPA widgets and estimates.
4. Use **Home**, **Grades**, **Upcoming**, **Missing**, and **AI** from the main navigation. On Home, tap **Customize** to rearrange widgets, resize large tiles, and add or remove widgets.

### Getting a Canvas access token

1. Log in to Canvas with your school account.
2. Open **Account** → **Settings**.
3. Under **Approved Integrations**, click **+ New Access Token**.
4. Name it (e.g. CanvasBuddy), create it, and copy the token into CanvasBuddy Settings.

The token should be able to **read** your courses and course content (assignments, pages, announcements, modules, calendar). CanvasBuddy’s dashboard uses a small set of APIs; the **AI assistant** may call additional read endpoints as needed for each question.

Revoke the token anytime in Canvas under **Settings → Approved Integrations**.

### Optional — Sign in with Canvas (OAuth)

If your school has set up CanvasBuddy with OAuth, you can use **Sign in with Canvas** after creating a CanvasBuddy account. Your host must configure developer keys (see below).

---

## For schools / hosts (one-time OAuth setup)

Optional. Enables **Sign in with Canvas** so students can skip pasting tokens.

1. In Canvas: **Admin → Developer Keys → + Developer Key** (API key).
2. Set **Redirect URI** to your app’s callback URL, e.g. `https://your-app-domain.com/api/auth/canvas/callback`.
3. Enable scopes (if your instance uses scoped keys). **Dashboard** (minimum):
   - `url:GET|/api/v1/courses`
   - `url:GET|/api/v1/planner/items`
   - `url:GET|/api/v1/users/self`
   - `url:GET|/api/v1/courses/:course_id/assignments`
   
   **AI agent** (add these for syllabus, search, announcements, pages, modules, calendar):
   - `url:GET|/api/v1/courses/:course_id/search`
   - `url:GET|/api/v1/courses/:course_id/discussion_topics`
   - `url:GET|/api/v1/courses/:course_id/pages`
   - `url:GET|/api/v1/courses/:course_id/pages/:url`
   - `url:GET|/api/v1/courses/:course_id/modules`
   - `url:GET|/api/v1/courses/:course_id/modules/:module_id/items`
   - `url:GET|/api/v1/courses/:course_id/front_page`
   - `url:GET|/api/v1/calendar_events`
   
   Personal access tokens (Settings) usually include full read access without listing each scope.
4. Enable the key and copy **Client ID** and **Client Secret**.
5. Configure environment variables (see below).

---

## Setup

1. Create a [Supabase](https://supabase.com) project.

2. In the Supabase SQL editor, run `supabase/migrations/000_setup_all.sql`. It
   creates every table, RLS policy, and grant the app needs and is safe to
   re-run (idempotent), so it also fixes any "permission denied" errors on the
   Canvas or GPA tables after sign-in.

3. In Supabase **Authentication → URL Configuration**, set:
   - **Site URL** to your deployed app URL (e.g. `https://your-app-domain.com`)
   - **Redirect URLs** to include your auth callback (e.g. `https://your-app-domain.com/auth/callback`)

4. **Email confirmation (Brevo, not Supabase SMTP)**  
   Sign-up sends confirmation links through [Brevo](https://www.brevo.com) transactional email. Supabase’s built-in auth emails are not used.
   - Keep **Confirm email** enabled under **Authentication → Providers → Email** so accounts stay unverified until the link is clicked.
   - You do not need to configure Supabase **SMTP** or custom email templates.
   - In Brevo: create an API key, verify a sender address (**Senders & IPs**), then set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and optionally `BREVO_SENDER_NAME` in `.env.local`.
   - Add `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API** (server-only; never expose to the browser).

5. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

6. Set at minimum:

   ```bash
   SESSION_SECRET=<random-string-at-least-32-characters>
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   BREVO_API_KEY=<your-brevo-api-key>
   BREVO_SENDER_EMAIL=<verified-sender@yourdomain.com>
   ANTHROPIC_API_KEY=<your-anthropic-api-key>   # required for /ai
   ```

7. **Additional** for OAuth sign-in (school hosting):

   - `CANVAS_BASE_URL`
   - `CANVAS_CLIENT_ID` / `CANVAS_CLIENT_SECRET`
   - `CANVAS_REDIRECT_URI` (must match the redirect URI registered in Canvas)

8. Install and run:

   ```bash
   npm install
   npm run build
   npm start
   ```

9. Sign in at your app URL, connect Canvas in **Settings**, then explore **Home** and the other pages.

### Production deployment (e.g. canvasbuddy.ai)

Local `.env.local` is **not** uploaded to your host. Set the same server variables in your platform (Vercel, etc.), then **redeploy**:

| Variable | Required for sign-up |
|----------|-------------------|
| `SESSION_SECRET` | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (sign-up confirmation links) |
| `BREVO_API_KEY` | Yes |
| `BREVO_SENDER_EMAIL` | Yes |

Check readiness after deploy: `GET https://your-domain.com/api/auth/signup/status` — `ready` should be `true`.

In Supabase **Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** to your production domain (e.g. `https://canvasbuddy.ai/auth/callback`).

Set `NEXT_PUBLIC_SITE_URL=https://canvasbuddy.ai` in Vercel so confirmation emails always use the production domain.

**Local dev:** If you see `Cannot find module './1331.js'` after clicking an email link, stop the dev server, run `npm run clean`, then `npm run dev` again (stale `.next` cache).

## How it works

### Auth and stored preferences

- **Supabase auth**: Email/password sign-in. Sign-up confirmation emails go through Brevo; links are created with the Supabase service role and finish at `/auth/callback`.
- **`user_canvas_credentials`**: Per-user Canvas URL and access token (row-level security).
- **`user_gpa_preferences`**: GPA scale and weighting for widgets and estimates.
- **`user_app_preferences`**: Home widget layout and upcoming horizon (days). Without this table, layout can fall back to browser storage.

### Pages and Canvas data

| Page | What it shows | Main Canvas APIs |
|------|----------------|------------------|
| **Home** | Drag-and-drop widgets; layout saved per user | Courses, planner, assignments (shared app-data fetch) |
| **Grades** | Active course scores and GPA | `GET /api/v1/courses` with grade includes |
| **Upcoming** | Due tomorrow + assignments in your horizon | Planner + per-course assignments |
| **Missing** | Missing, overdue, or zero-scored work (lookback window) | Per-course assignments |
| **AI** | Prompt-driven search across Canvas | Agent calls allowlisted Canvas APIs per question (courses, search, syllabus, announcements, modules, pages, assignments, planner, calendar, grades) |

Canvas tokens stay on the server. The AI agent fetches live data via tools; only **text results** are sent to Anthropic (never your token).

### Example AI questions

- “When is my chem project due?”
- “What do I have due tomorrow?”
- “What is my English syllabus?”
- “When is my calculus potluck?”
- “Which class has my lowest grade?”

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm start`     | Run production server    |
