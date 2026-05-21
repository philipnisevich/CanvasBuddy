# CanvasBuddy

A student dashboard that connects to Canvas and shows:

- **Current grades** for all active courses
- **Assignments and quizzes due tomorrow** across all classes
- **AI assignment assistant** — ask natural-language questions about due dates and how to approach work (powered by Claude)

You use your **normal school Canvas account** — never an administrator login.

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
2. Set **Redirect URI** to match your deployment, e.g. `http://localhost:3000/api/auth/canvas/callback`.
3. Enable scopes (if your instance uses scoped keys):
   - `url:GET|/api/v1/courses`
   - `url:GET|/api/v1/planner/items`
   - `url:GET|/api/v1/users/self`
   - `url:GET|/api/v1/courses/:course_id/assignments` (for the assignment assistant)
4. Enable the key and copy **Client ID** and **Client Secret**.
5. Configure environment variables (see below).

---

## Local development

1. Create a [Supabase](https://supabase.com) project.

2. In the Supabase SQL editor, run the migration in `supabase/migrations/001_user_canvas_credentials.sql`.

3. In Supabase **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

4. For **local development**, under **Authentication → Providers → Email**, turn off **Confirm email** so sign-up does not send a message every attempt (avoids Supabase’s built-in email rate limit while testing).

5. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

6. Set at minimum:

   ```bash
   SESSION_SECRET=<random-string-at-least-32-characters>
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ANTHROPIC_API_KEY=<your-anthropic-api-key>   # optional; assistant only
   ```

7. **Additional** for OAuth sign-in (school hosting):

   - `CANVAS_BASE_URL`
   - `CANVAS_CLIENT_ID` / `CANVAS_CLIENT_SECRET`
   - `CANVAS_REDIRECT_URI`

8. Install and run:

   ```bash
   npm install
   npm run dev
   ```

9. Open [http://localhost:3000](http://localhost:3000), sign in, then add your Canvas token in **Settings**.

## How it works

- **Supabase auth**: Each student signs in with email/password. Canvas tokens are stored per user in `user_canvas_credentials` (protected by row-level security).
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
