# Product

## Register

product

## Users

Students (primarily high school and college) who use Canvas LMS for their coursework and want a faster, clearer read on where they stand. They arrive in a specific state: checking grades before/after an assignment posts, scanning what's due soon, or confronting what's missing — often a little stressed, often on a phone between classes. The job to be done: *"Tell me where I stand and what to do next, accurately and without making me anxious."* A secondary job is asking the AI assistant focused questions about their own coursework ("what's my grade if I bomb the final," "what am I missing in Bio").

The stakes are real: these are actual grades and deadlines that affect GPA. The interface is trusted with consequential, personal data, so it has to feel reliable, not toy-like.

## Product Purpose

CanvasBuddy reads a student's live Canvas data (grades, due dates, missing work) and presents it as a focused dashboard plus an AI study assistant scoped to their schoolwork. It exists because Canvas itself is cluttered, slow to answer "where do I stand," and not built around the student's actual moment-to-moment questions. Success looks like: a student opens CanvasBuddy instead of Canvas to answer "how am I doing," trusts the numbers, and leaves knowing the one or two things to act on — without the institutional friction or the dread.

## Brand Personality

Sharp and academic. Serious, precise, trustworthy — a professional tool a student is comfortable handing their GPA to. Calm and data-forward rather than warm-and-fuzzy: it respects the user's time and intelligence, presents numbers with confidence, and never performs cuteness. Three words: **precise, trustworthy, calm.**

Note a real tension to resolve in DESIGN.md: the current implementation leans playful (claymorphism surfaces, Baloo 2 / Comic Neue type). The stated product direction is the opposite end — sharper, more academic, less soft. Future visual work should pull toward credibility and clarity, not whimsy. Keep approachability in the *clarity and calm*, not in cartoonishness.

## Anti-references

- **Canvas LMS itself** — cluttered, institutional, dated enterprise feel. CanvasBuddy must read as lighter, faster, and clearer than the system it pulls from.
- **Cold enterprise SaaS** — generic navy-and-gray analytics dashboards, soulless data tables, corporate reporting tools. Professional, but not lifeless.
- **Childish / gamified** — cartoon badges, confetti, mascots, kid-app aesthetics. Real grades undercut by playground UI reads as untrustworthy.
- **Anything that feels like a game or otherwise unprofessional** — the student is trusting it with consequential academic data; novelty for its own sake erodes that trust.
- **Anxiety-inducing** — walls of aggressive red alerts, guilt-driven nagging about missing work. Surface stakes plainly, don't punish.

## Design Principles

1. **Trust through precision.** Numbers are the product. Grades, GPA, and dates must look exact, consistent, and authoritative — computed once in shared pure modules and presented identically across the dashboard and the AI assistant. Never let the UI imply more or less certainty than the data warrants.
2. **Lighter than the source.** Every screen should answer a question Canvas makes you dig for. If a view doesn't get the student to "where do I stand / what's next" faster than Canvas would, it's not earning its place.
3. **Calm under stakes.** Missing work and bad grades are surfaced honestly but without alarm theater. Inform, don't nag. Reserve high-saturation/danger color for genuine, actionable urgency.
4. **Earned familiarity.** Standard product affordances done well — consistent nav, real loading/empty/error states, predictable controls. The tool should disappear into the task, not announce itself.
5. **Professional, not precious.** Approachability comes from clarity and calm, not from cartoon flourish. When in doubt, choose the option a serious student would trust with their transcript.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**: ≥4.5:1 contrast for body text (≥3:1 for large/bold), visible `:focus-visible` on every interactive element, full keyboard navigation, and a `prefers-reduced-motion` alternative for every animation. Mobile-first — students are often on phones — so test layouts at 375 / 768 / 1024 / 1440 with no horizontal scroll and no content trapped behind fixed nav. Color must never be the sole signal for state (missing, late, success): pair it with text or icon.
