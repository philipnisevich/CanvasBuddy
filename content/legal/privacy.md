CanvasBuddy ("CanvasBuddy," "we," "us," or "our") provides a student dashboard that reads your Canvas LMS data and offers an AI study assistant. This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and the rights you have over it.

This service is intended for users **13 years of age or older**. See [Children's Privacy](#childrens-privacy) below.

> This document is provided for transparency and is not legal advice.

## Who we are

CanvasBuddy is operated as an independent project under the name **CanvasBuddy**. We may form a legal entity in the future and will update this policy if we do.

For any privacy question or request, contact us at **privacy@canvasbuddy.ai**.

## Information we collect

**Account information.** When you create an account, we collect your email address and a password. Passwords are stored, salted, and hashed by our authentication provider (Supabase) — we never store your password in plain text.

**Canvas connection.** To load your dashboard, you connect a Canvas account by either pasting a Personal Access Token (PAT) or signing in with Canvas (OAuth). We store your Canvas base URL and access token — and, for OAuth, a refresh token and expiry — so we can fetch your data on your behalf. You connect with a normal **student** account, not an administrator login.

**Canvas academic data (transient).** When you use the app, we fetch data from Canvas such as your courses, grades, assignments, due dates, and missing work. This data is processed on our servers to build your dashboard and is **not stored in our database** — it is fetched on demand and held only for the duration of the request.

**Preferences.** We store settings you choose, such as your GPA scale and course weighting, home-screen widget layout, and how far ahead the "upcoming" view looks.

**AI assistant content.** When you ask the AI study assistant a question, we process your question and the relevant derived Canvas data (see [How your Canvas data is protected](#how-your-canvas-data-is-protected)) to generate an answer.

**Technical data.** We receive your browser's time zone (so dates are shown correctly) and standard request information such as IP address and user agent that any web server receives.

## How your Canvas data is protected

This is central to how CanvasBuddy works:

- **Your Canvas access token never reaches your browser or any AI provider.** All Canvas requests happen on our servers. Only the derived numbers and text (for example, a computed GPA or a list of due dates) are sent back to your browser.
- When you use the AI assistant, only the **derived** text and data needed to answer your question are sent to our AI provider — never your Canvas token or raw credentials.
- Canvas user information (grades, enrollments, profile details) is treated as private and is used only to operate the features you request. We do not repurpose it, and we do not sell it.

## How we use your information

We use the information above to:

- authenticate you and keep your account secure;
- connect to Canvas and build your grades, upcoming, and missing-work views;
- power the AI study assistant;
- remember your preferences;
- send account emails (sign-up confirmation and password resets);
- operate, maintain, debug, and improve the service; and
- comply with legal obligations and enforce our Terms.

## Legal bases (EU/UK users)

Where the GDPR or UK GDPR applies, we rely on the following legal bases:

- **Performance of a contract** — to provide the service you sign up for (account, Canvas dashboard, AI assistant, preferences).
- **Consent** — for connecting your Canvas account and for optional features; you may withdraw consent at any time by disconnecting Canvas or deleting your account.
- **Legitimate interests** — to secure, maintain, and improve the service, where not overridden by your rights.
- **Legal obligation** — where we must retain or disclose information to comply with law.

## Service providers and subprocessors

We share personal information only with the service providers we rely on to run CanvasBuddy. Each processes data on our behalf under its own terms:

| Provider | Purpose | Data involved |
|---|---|---|
| Supabase | Authentication and database hosting | Account email, hashed password, Canvas credentials, preferences |
| Brevo | Transactional email (confirmation, password reset) | Email address |
| Anthropic | AI study assistant | Your questions and derived Canvas data (no Canvas token) |
| Instructure / Canvas | Source of your academic data (via your connection) | Data you authorize us to read from your Canvas account |
| Vercel | Application hosting and delivery | Request data (e.g. IP, user agent) |

We do **not sell** your personal information, and we do not share it with advertisers.

**AI processing.** Your questions and the derived Canvas data used to answer them are processed by Anthropic to generate responses. Under Anthropic's commercial/API terms, this data is not used to train their models by default. The AI assistant can be inaccurate; always verify important information against Canvas.

## International data transfers

Our providers may process data in the United States and other countries. Where we transfer personal data out of the EEA or UK, we rely on appropriate safeguards (such as Standard Contractual Clauses) offered by those providers.

## Data retention

- **Account, credentials, and preferences** are retained while your account is active.
- **Canvas academic data** is not stored; it is fetched on demand and discarded after each request.
- When you delete your account, we delete your account, stored Canvas credentials, and preferences (see below). Backups and provider logs are purged on their normal cycles.

## Your rights and choices

You can:

- **Disconnect Canvas** at any time in Settings, which removes your stored Canvas credentials.
- **Delete your account** at any time from **Settings → Account**, which permanently removes your account, stored Canvas credentials, and preferences.

Depending on where you live, you may also have the following rights:

**EU/UK (GDPR):** access, rectification, erasure, restriction, portability, objection, and the right to lodge a complaint with your data protection authority.

**California (CCPA/CPRA):** the right to know what we collect, the right to delete, the right to correct, and the right to opt out of "sale" or "sharing." We do **not** sell or share your personal information as those terms are defined by California law. We will not discriminate against you for exercising your rights.

To exercise any right, contact us at **privacy@canvasbuddy.ai**. We will verify your request against your account before acting on it.

## Cookies and local storage

CanvasBuddy uses only **strictly necessary / functional** storage:

- a session cookie to keep you signed in;
- a session cookie for the Canvas connection when you are not signed in with an account; and
- browser `localStorage` to remember your chosen accent color.

We do **not** use advertising or third-party analytics/tracking cookies, so no cookie-consent banner is required. Disabling these cookies will prevent sign-in and core features from working.

## Children's privacy

CanvasBuddy is **not directed to children under 13**, and we do not knowingly collect personal information from anyone under 13. By using the service you confirm you are at least 13 years old. If you believe a child under 13 has provided us information, contact us and we will delete it.

## Security

We use industry-standard measures to protect your information, including encryption in transit, hashed passwords, server-side handling of Canvas tokens, and per-user row-level security on our database. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.

## Changes to this policy

We may update this policy from time to time. We will change the "Last updated" date and, for material changes, provide additional notice. We will not retroactively reduce your rights over information we already collected without your consent.

## Contact

Questions or requests: **privacy@canvasbuddy.ai**.
