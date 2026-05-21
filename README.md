# CanvasBuddy

A student dashboard that connects to Canvas and shows:

- **Current grades** for all active courses
- **Assignments and quizzes due tomorrow** across all classes

You use your **normal school Canvas account** — never an administrator login.

## For students

You can connect in either way:

### Option A — Connect yourself (no admin setup)

Works on any Canvas school without IT involvement.

1. Open CanvasBuddy (e.g. [http://localhost:3000](http://localhost:3000) when running locally).
2. Under **Connect yourself**, enter your school’s Canvas URL (the address in your browser when you open Canvas, e.g. `https://canvas.university.edu`).
3. In Canvas, while logged in as yourself:
   - **Account** → **Settings**
   - **Approved Integrations** → **+ New Access Token**
   - Name it (e.g. CanvasBuddy), create it, and copy the token
4. Paste the token into CanvasBuddy and click **Connect with access token**.

Your token is stored only in an encrypted session cookie on the server running CanvasBuddy. Revoke it anytime in Canvas under **Settings → Approved Integrations**.

### Option B — Sign in with Canvas

If your school has set up CanvasBuddy with OAuth, click **Sign in with Canvas** and log in with your usual school credentials (SSO/password — same as Canvas).

You do **not** need access to Admin → Developer Keys.

---

## For schools / hosts (one-time OAuth setup)

Optional. Enables **Sign in with Canvas** so students skip pasting tokens.

1. In Canvas: **Admin → Developer Keys → + Developer Key** (API key).
2. Set **Redirect URI** to match your deployment, e.g. `http://localhost:3000/api/auth/canvas/callback`.
3. Enable scopes (if your instance uses scoped keys):
   - `url:GET|/api/v1/courses`
   - `url:GET|/api/v1/planner/items`
   - `url:GET|/api/v1/users/self`
4. Enable the key and copy **Client ID** and **Client Secret**.
5. Configure environment variables (see below).

Students still never use the admin console — only IT does, once.

---

## Local development

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. **Minimum** for student token login only:

   ```bash
   SESSION_SECRET=<random-string-at-least-32-characters>
   ```

3. **Additional** for OAuth sign-in (school hosting):

   - `CANVAS_BASE_URL`
   - `CANVAS_CLIENT_ID` / `CANVAS_CLIENT_SECRET`
   - `CANVAS_REDIRECT_URI`

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Access token**: Student supplies Canvas URL + personal access token; server validates via `GET /api/v1/users/self` and stores credentials in an encrypted httpOnly cookie.
- **OAuth**: Authorization code flow with refresh tokens when the school configures a developer key.
- Grades: `GET /api/v1/courses?include[]=total_scores`
- Due tomorrow: `GET /api/v1/planner/items` for the next calendar day in your timezone

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm start`     | Run production server    |
