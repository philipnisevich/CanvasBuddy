# CanvasBuddy

A student dashboard that connects to Canvas and shows:

- **Current grades** for all active courses
- **Assignments and quizzes due tomorrow** across all classes
- **AI assignment assistant** — ask natural-language questions about due dates and how to approach work (powered by Claude)

## For students

1. **Create an account** or sign in at `/login` (email and password via Supabase).
2. Open **Settings** and add your school **Canvas URL** and a **personal access token** from Canvas.
3. Return to the dashboard to see grades, due tomorrow, and the assignment assistant.

### Getting a Canvas access token

1. Log in to Canvas with your school account.
2. Open **Account** → **Settings**.
3. Under **Approved Integrations**, click **+ New Access Token**.
4. Name it (e.g. CanvasBuddy), create it, and copy the token into CanvasBuddy Settings.

Revoke the token anytime in Canvas under **Settings → Approved Integrations**.

### Optional — Sign in with Canvas (OAuth)

If your school has set up CanvasBuddy with OAuth, you can use **Sign in with Canvas** after creating a CanvasBuddy account. Your host must configure developer keys (see below).

---

## For schools / hosts (one-time OAuth setup)

Optional. Enables **Sign in with Canvas** so students can skip pasting tokens.

1. In Canvas: **Admin → Developer Keys → + Developer Key** (API key).
2. Set **Redirect URI** to your app’s callback URL, e.g. `https://your-app-domain.com/api/auth/canvas/callback`.
3. Enable scopes (if your instance uses scoped keys):
   - `url:GET|/api/v1/courses`
   - `url:GET|/api/v1/planner/items`
   - `url:GET|/api/v1/users/self`
   - `url:GET|/api/v1/courses/:course_id/assignments` (for the assignment assistant)
4. Enable the key and copy **Client ID** and **Client Secret**.
5. Configure environment variables (see below).

---

## Setup

1. Create a [Supabase](https://supabase.com) project.

2. In the Supabase SQL editor, run the migration in `supabase/migrations/001_user_canvas_credentials.sql`.

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
   ANTHROPIC_API_KEY=<your-anthropic-api-key>   # optional; assistant only
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

9. Sign in at your app URL, then add your Canvas token in **Settings**.

## How it works

- **Supabase auth**: Each student signs in with email/password. Sign-up confirmation emails are sent via Brevo; the link is generated with the Supabase Admin API and still completes verification through `/auth/callback`. Canvas tokens are stored per user in `user_canvas_credentials` (protected by row-level security). GPA scale and weighting live in `user_gpa_preferences` (run `supabase/migrations/003_user_gpa_preferences.sql` in the SQL editor).
- **Access token**: Student supplies Canvas URL + personal access token in Settings; server validates via `GET /api/v1/users/self`.
- **OAuth** (optional): Authorization code flow with refresh tokens when the school configures a developer key.
- Grades: `GET /api/v1/courses?include[]=total_scores`
- Due tomorrow: `GET /api/v1/planner/items` for the next calendar day in your timezone
- Assignment assistant: loads assignments from each active course, sends a summarized snapshot to Claude — your Canvas token never leaves the server except for Canvas API calls

### Example assistant questions

- “When is my chem project due?”
- “What do I have due tomorrow?”
- “Look at my English assignment for tomorrow and give me an outline for how to do it.”

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm start`     | Run production server    |
