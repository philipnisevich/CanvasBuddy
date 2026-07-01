---
name: CanvasBuddy
description: A precision-ledger Canvas dashboard — flat hairline surfaces, one ink accent, light-only.
colors:
  accent-ink: "oklch(0.50 0.15 264)"
  accent-forest: "oklch(0.48 0.10 155)"
  accent-oxblood: "oklch(0.45 0.14 18)"
  bg: "oklch(0.975 0.004 255)"
  surface: "oklch(1 0 0)"
  surface-2: "oklch(0.965 0.005 255)"
  ink: "oklch(0.255 0.02 262)"
  muted-ink: "oklch(0.495 0.018 260)"
  hairline: "oklch(0.90 0.006 258)"
  hairline-strong: "oklch(0.80 0.012 258)"
  nav-bg: "oklch(0.235 0.022 264)"
  success: "oklch(0.55 0.12 150)"
  warning: "oklch(0.66 0.12 75)"
  danger: "oklch(0.55 0.20 27)"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  metric:
    fontFamily: "Source Code Pro, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.09em"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.1rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "0.45rem 1rem"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.45rem 1rem"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.35rem 0.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.85rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: CanvasBuddy

## 1. Overview

**Creative North Star: "The Ledger"**

CanvasBuddy presents a student's grades, deadlines, and missing work the way a precise ledger does: flat, exact, and quiet, so the numbers carry the meaning. The interface is a near-monochrome cool-slate field carrying a **single ink accent**, with structure drawn by **1px hairlines** rather than shadow or ornament. It is deliberately lighter, faster, and less cluttered than Canvas itself — answering "where do I stand?" at a glance.

Type is a coherent **Source superfamily** in three roles that contrast on silhouette: **Source Serif 4** for headings and titles (scholarly voice), **Source Sans 3** for body and dense UI, and **Source Code Pro** for the large tabular numerics — GPA, counts, grade columns — which read like receipt-precise ledger figures. Surfaces are flat by default; a shadow appears only on true overlays. The result is a credible academic tool a student trusts with their GPA.

The system is **light-only** and ships a **user-selectable accent** (Settings → Appearance): **Ink Blue** (default — fountain-pen ink), **Forest Green** (examination green), or **Oxblood** (leather-bound burgundy). The accent is driven by `data-accent` on `<html>` (with `data-theme` pinned to `light`), applied before first paint by an inline no-flash script and managed by `contexts/ThemeProvider.tsx`. Components read semantic CSS variables, so the accent propagates everywhere automatically.

This system explicitly rejects PRODUCT.md's anti-references: the **cluttered, institutional density of Canvas LMS itself**; the **cold navy-and-gray of generic enterprise SaaS dashboards**; anything **childish, gamified, or game-like**; and **anxiety theater** — walls of alerts that punish rather than inform. The accent is a scalpel, not a fire alarm.

**Key Characteristics:**
- Near-monochrome cool-slate field; one ink accent for action and current state only.
- Structure by 1px hairlines; flat surfaces, shadow reserved for overlays.
- Source superfamily in three silhouettes: serif heads, sans UI, mono numerics.
- Light-only, with three selectable accents (ink / forest / oxblood).
- Tight ~6px radii; calm 160ms state-only motion.

## 2. Colors

A near-monochrome cool-slate system carrying exactly one committed accent. All values are authored in **OKLCH**.

### Primary — the accent (selectable; default Ink Blue)
- **Ink Blue** (`oklch(0.50 0.15 264)`): the default signature — a deep fountain-pen ink. Drives primary actions, links, focus rings, the current selection/active state, and metric highlights. `--accent-hover` / `--accent-active` deepen it; `--accent-soft` is the faint wash behind active chips, the bot avatar, and selected rows; `--accent-ink` is the readable accent-tone text on that wash; `--on-accent` is the text on a solid accent fill.
- **Forest Green** (`oklch(0.48 0.10 155)`) and **Oxblood** (`oklch(0.45 0.14 18)`) are the two alternate accents, each with the same soft/ink/on-accent ramp.

### Neutral
- **Ink** (`oklch(0.255 0.02 262)`): primary text. A cool near-black, never pure black.
- **Muted Ink** (`oklch(0.495 0.018 260)`): secondary text, captions, placeholders. Verified ≥4.5:1 on its canvas.
- **Background** (`oklch(0.975 0.004 255)`): the flat app canvas — a cool near-white.
- **Surface / Surface-2 / Surface-3**: white → faint-gray inset layers.
- **Hairline** (`oklch(0.90 0.006 258)`) and **Hairline-Strong**: the 1px borders that carry all structure.
- **Nav** (`oklch(0.235 0.022 264)`): the dark ink-slate token retained for the chat avatar and any dark chrome — a consistent ledger anchor.

### Semantic (state only)
- **Success** green, **Warning** amber, **Danger** red — each with a `-soft` background wash and a readable `-ink` text tone. Danger is its **own** red, distinct from the (blue/green/oxblood) accent.

### Named Rules
**The Scalpel Rule.** The accent marks action and genuine state only — primary actions, current selection, focus, links. Never decoration, never a divider. Target ≤10% accent coverage on any screen.

**The Hairline Rule.** Structure is drawn with 1px hairlines, not shadow and not heavy borders. If a surface needs separating, it gets a hairline — not a drop shadow.

## 3. Typography

**Heading Font:** Source Serif 4 (fallback `Georgia, "Times New Roman", serif`) — weights 600 / 700.
**Body / UI Font:** Source Sans 3 (fallback `system-ui, sans-serif`) — weights 400 / 500 / 600 / 700.
**Numeric / Mono Font:** Source Code Pro (fallback `ui-monospace, SFMono-Regular, Menlo, monospace`) — weights 500 / 600 / 700, applied via `.cb-metric` and inline code.

**Character:** One superfamily, three silhouettes. Serif for the academic voice (headings, titles), sans for everything you operate, mono for everything you read as data. The mono numerics are the "ledger" signature — receipt-precise, tabular, aligned — not a cold terminal, because they appear only on figures.

### Hierarchy
- **Display** (Serif 700, 1.875rem, `-0.005em`): page titles. `text-wrap: balance`.
- **Headline** (Serif 700, 1.5rem): major section headings.
- **Title** (Serif 700, 1.125rem): card titles, panel headers.
- **Metric** (`.cb-metric` — Source Code Pro 700, `tabular-nums lining-nums`, `-0.02em`): GPA, missing counts, grade percentages — the ledger figures.
- **Body** (Sans 400/500, 1rem, line-height 1.6): reading text, 65–75ch.
- **Label** (Sans 700, 0.6875rem, 0.09em, UPPERCASE): the `cb-section-label` accent-tone tag — at most one per section.

### Named Rules
**The Three-Silhouette Rule.** Serif heads, sans reads, mono counts. Never set a page title in the sans, never set running body in the serif, and reserve the mono strictly for numerics and code.

## 4. Elevation

**Flat by default.** Surfaces sit on the canvas separated by a 1px hairline and, at most, a barely-there contact shadow (`--shadow-clay`, ~0.05 alpha). Real elevation — `--shadow-overlay` — is reserved for things that genuinely float over content: dropdowns, modals, toasts, the skip link. Depth *changes* only on interaction.

### Shadow Vocabulary
- **`--shadow-clay`** (near-flat contact): default card/panel — almost imperceptible, the hairline does the work.
- **`--shadow-clay-pressed`** (inset): pressed primary button.
- **`--shadow-overlay`** (`0 10px 30px …`): the only true elevation — overlays only.

### Named Rules
**The Flat-By-Default Rule.** Resting surfaces are flat. If you reach for a drop shadow on a card, stop — use a hairline. Shadow means "this floats above the page," nothing less.

**The Depth-Is-Feedback Rule.** Interactive cards lift to a 1px accent ring on hover; buttons inset on press. Any change in elevation means "you touched something."

## 5. Components

### Buttons (radius 6px, 1px borders, 160ms ease-out)
- **Primary** (`cb-btn-primary`): solid accent fill, `--on-accent` text. Hover/active deepen the fill; pressed adds an inset shadow; disabled drops to 0.5 opacity.
- **Secondary** (`cb-btn-secondary`): transparent fill, 1px accent border, accent-tone text; hover washes `--accent-soft`.
- **Ghost** (`cb-btn-ghost`): white/surface fill, hairline-strong border, ink text — the quiet default. Hover darkens border + fills surface-2.
- **Danger** (`cb-btn-danger`): transparent, danger border + danger-ink text; hover washes danger-soft. Destructive actions only.
- **Nav Secondary** (`cb-btn-secondary-nav`): a light-surface button (hairline-strong border, ink text) for header account actions — matches the ghost style.
- **Icon button** (`cb-icon-btn`, `--danger` variant): square, hairline-strong border. Lucide icons only.

### Chips (`cb-chip`, `--active`)
White fill, hairline-strong border, ink text; **active** uses accent border + `--accent-soft` fill + accent-ink text.

### Cards / Containers (`cb-card`, `-muted`, `-interactive`)
Radius 8px, 1px hairline, flat. `-interactive` adds `cursor: pointer` and a 1px accent-ring on hover. Internal padding 1.5rem. Nested cards are forbidden.

### Inputs (`cb-input`)
White/surface fill, 1px hairline-strong border, 6px radius. **Focus:** accent border + 3px `--accent-ring` glow — the same focus language as the global `:focus-visible` (2px accent outline).

### Navigation
A sticky light header on the app canvas (`bg`) with a 1px hairline bottom border (no glass, no blur). Capped at 72rem. Holds the wordmark, page nav, and account actions. Mobile collapses; content never hides behind it.

### Accent controls
- **Appearance panel** (`components/settings/AppearanceSettings.tsx`, Settings → Appearance) offers the three accent swatches. State lives in `ThemeProvider`, persisted to `localStorage` (`cb-accent`).

### AI Chat (signature)
A 48rem thread: assistant rows are hairline-divided full-width prose with an accent-soft bot avatar; user rows are right-aligned `--accent-soft` bubbles with accent-ink text and an asymmetric radius. Composer is a rounded field with a focus-within accent ring and a square accent send button. Empty state centers an accent-soft icon disc with a teaching prompt.

## 6. Do's and Don'ts

### Do:
- **Do** keep the accent for action and genuine state only — primary actions, current selection, focus, links. ≤10% coverage (The Scalpel Rule).
- **Do** draw structure with 1px hairlines; keep resting surfaces flat (The Hairline / Flat-By-Default Rules).
- **Do** use the three silhouettes correctly: serif heads, sans reads, mono (`.cb-metric`) for numerics.
- **Do** read the semantic vars (`--ink`, `--muted`, `--surface`, `--accent`, `--accent-soft`, `--danger-ink`…) so every accent re-skins automatically. Never hardcode a hex.
- **Do** verify ≥4.5:1 for `--muted-ink` text and placeholders; pair color with text/icon for state, never color alone.
- **Do** keep transitions 150–250ms ease-out and honor `prefers-reduced-motion`; give every control `cursor: pointer` and a visible accent `:focus-visible` ring.

### Don't:
- **Don't** reproduce **Canvas LMS's cluttered, institutional density** — read lighter and answer "where do I stand?" faster.
- **Don't** drift toward **cold enterprise SaaS** — generic navy-and-gray dashboards, soulless tables, corporate chrome.
- **Don't** add anything **childish, gamified, or game-like** — no confetti, mascots, cartoon badges, or playful display fonts.
- **Don't** build **anxiety theater** — walls of alerts or guilt-driven nagging. The accent is a scalpel, not a fire alarm.
- **Don't** put a drop shadow on a resting card, or float a borderless surface — use a hairline.
- **Don't** hardcode colors, use glassmorphism/backdrop-blur in nav or cards, gradient text, or `border-left` colored stripes as accents.
- **Don't** set numerics in the serif or body in the mono — keep the silhouettes in their lanes.
