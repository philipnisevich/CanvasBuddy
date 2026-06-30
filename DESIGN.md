---
name: CanvasBuddy
description: A precision-ledger Canvas dashboard — flat hairline surfaces, one ink accent, light + dark.
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
  bg-dark: "oklch(0.20 0.015 262)"
  surface-dark: "oklch(0.235 0.018 262)"
  ink-dark: "oklch(0.96 0.005 255)"
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

The system ships **light and dark** themes and a **user-selectable accent** (Settings → Appearance): **Ink Blue** (default — fountain-pen ink), **Forest Green** (examination green), or **Oxblood** (leather-bound burgundy). The theme is driven by `data-theme` (light/dark) × `data-accent` on `<html>`, applied before first paint by an inline no-flash script and managed by `contexts/ThemeProvider.tsx`. Components read semantic CSS variables, so theme and accent propagate everywhere automatically.

This system explicitly rejects PRODUCT.md's anti-references: the **cluttered, institutional density of Canvas LMS itself**; the **cold navy-and-gray of generic enterprise SaaS dashboards**; anything **childish, gamified, or game-like**; and **anxiety theater** — walls of alerts that punish rather than inform. The accent is a scalpel, not a fire alarm.

**Key Characteristics:**
- Near-monochrome cool-slate field; one ink accent for action and current state only.
- Structure by 1px hairlines; flat surfaces, shadow reserved for overlays.
- Source superfamily in three silhouettes: serif heads, sans UI, mono numerics.
- Light + dark, plus three selectable accents (ink / forest / oxblood).
- Tight ~6px radii; calm 160ms state-only motion.

## 2. Colors

A near-monochrome cool-slate system carrying exactly one committed accent. All values are authored in **OKLCH**; the accent and every neutral are theme-aware.

### Primary — the accent (selectable; default Ink Blue)
- **Ink Blue** (`oklch(0.50 0.15 264)` light / `oklch(0.70 0.13 264)` dark): the default signature — a deep fountain-pen ink that brightens to luminous periwinkle on the dark canvas. Drives primary actions, links, focus rings, the current selection/active state, and metric highlights. `--accent-hover` / `--accent-active` deepen (light) or brighten (dark); `--accent-soft` is the faint wash behind active chips, the bot avatar, and selected rows; `--accent-ink` is the readable accent-tone text on that wash; `--on-accent` is the text on a solid accent fill (light in light theme, dark in dark theme).
- **Forest Green** (`oklch(0.48 0.10 155)`) and **Oxblood** (`oklch(0.45 0.14 18)`) are the two alternate accents, each with the same light/dark + soft/ink/on-accent ramp.

### Neutral (theme-aware)
- **Ink** (`oklch(0.255 0.02 262)` light / `oklch(0.96 0.005 255)` dark): primary text. A cool near-black, never pure black.
- **Muted Ink** (`oklch(0.495 0.018 260)` / `oklch(0.71 0.016 258)`): secondary text, captions, placeholders. Verified ≥4.5:1 on its canvas in both themes.
- **Background** (`oklch(0.975 0.004 255)` / `oklch(0.20 0.015 262)`): the flat app canvas — cool near-white, or a deep ink-slate "desk at night."
- **Surface / Surface-2 / Surface-3**: white → faint-gray inset layers (light); lifted slate layers (dark).
- **Hairline** (`oklch(0.90 0.006 258)` / `oklch(0.32 0.02 262)`) and **Hairline-Strong**: the 1px borders that carry all structure.
- **Nav** (`oklch(0.235 0.022 264)`): the header chrome is an intentionally dark ink-slate in **both** themes — a consistent ledger header anchor.

### Semantic (state only, theme-tuned)
- **Success** green, **Warning** amber, **Danger** red — each with a `-soft` background wash and a readable `-ink` text tone, retuned per theme. Danger is its **own** red, distinct from the (blue/green/oxblood) accent.

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
- **`--shadow-overlay`** (`0 10px 30px …`, stronger in dark): the only true elevation — overlays only.

### Named Rules
**The Flat-By-Default Rule.** Resting surfaces are flat. If you reach for a drop shadow on a card, stop — use a hairline. Shadow means "this floats above the page," nothing less.

**The Depth-Is-Feedback Rule.** Interactive cards lift to a 1px accent ring on hover; buttons inset on press. Any change in elevation means "you touched something."

## 5. Components

### Buttons (radius 6px, 1px borders, 160ms ease-out)
- **Primary** (`cb-btn-primary`): solid accent fill, `--on-accent` text. Hover/active deepen (light) or brighten (dark); pressed adds an inset shadow; disabled drops to 0.5 opacity.
- **Secondary** (`cb-btn-secondary`): transparent fill, 1px accent border, accent-tone text; hover washes `--accent-soft`.
- **Ghost** (`cb-btn-ghost`): white/surface fill, hairline-strong border, ink text — the quiet default. Hover darkens border + fills surface-2.
- **Danger** (`cb-btn-danger`): transparent, danger border + danger-ink text; hover washes danger-soft. Destructive actions only.
- **Nav Secondary** (`cb-btn-secondary-nav`) and **Theme Toggle**: translucent-white-on-dark, for use inside the dark header only.
- **Icon button** (`cb-icon-btn`, `--danger` variant): square, hairline-strong border. Lucide icons only.

### Chips (`cb-chip`, `--active`)
White fill, hairline-strong border, ink text; **active** uses accent border + `--accent-soft` fill + accent-ink text.

### Cards / Containers (`cb-card`, `-muted`, `-interactive`)
Radius 8px, 1px hairline, flat. `-interactive` adds `cursor: pointer` and a 1px accent-ring on hover. Internal padding 1.5rem. Nested cards are forbidden.

### Inputs (`cb-input`)
White/surface fill, 1px hairline-strong border, 6px radius. **Focus:** accent border + 3px `--accent-ring` glow — the same focus language as the global `:focus-visible` (2px accent outline).

### Navigation (`cb-nav-shell`)
A dark ink-slate header bar in both themes with a faint translucent-white bottom hairline (no glass, no blur). Capped at 72rem. Holds the wordmark, page nav, account actions, and the **theme toggle** (sun/dark). Mobile collapses; content never hides behind it.

### Theme & Accent controls
- **Theme toggle** (`components/ui/ThemeToggle.tsx`) in the nav flips light/dark.
- **Appearance panel** (`components/settings/AppearanceSettings.tsx`, Settings → Appearance) offers Light / Dark / System and the three accent swatches. State lives in `ThemeProvider`, persisted to `localStorage` (`cb-theme-mode`, `cb-accent`).

### AI Chat (signature)
A 48rem thread: assistant rows are hairline-divided full-width prose with an accent-soft bot avatar; user rows are right-aligned `--accent-soft` bubbles with accent-ink text and an asymmetric radius. Composer is a rounded field with a focus-within accent ring and a square accent send button. Empty state centers an accent-soft icon disc with a teaching prompt.

## 6. Do's and Don'ts

### Do:
- **Do** keep the accent for action and genuine state only — primary actions, current selection, focus, links. ≤10% coverage (The Scalpel Rule).
- **Do** draw structure with 1px hairlines; keep resting surfaces flat (The Hairline / Flat-By-Default Rules).
- **Do** use the three silhouettes correctly: serif heads, sans reads, mono (`.cb-metric`) for numerics.
- **Do** read theme-aware semantic vars (`--ink`, `--muted`, `--surface`, `--accent`, `--accent-soft`, `--danger-ink`…) so light, dark, and every accent re-skin automatically. Never hardcode a hex.
- **Do** verify ≥4.5:1 for `--muted-ink` text and placeholders in **both** themes; pair color with text/icon for state, never color alone.
- **Do** keep transitions 150–250ms ease-out and honor `prefers-reduced-motion`; give every control `cursor: pointer` and a visible accent `:focus-visible` ring.

### Don't:
- **Don't** reproduce **Canvas LMS's cluttered, institutional density** — read lighter and answer "where do I stand?" faster.
- **Don't** drift toward **cold enterprise SaaS** — generic navy-and-gray dashboards, soulless tables, corporate chrome.
- **Don't** add anything **childish, gamified, or game-like** — no confetti, mascots, cartoon badges, or playful display fonts.
- **Don't** build **anxiety theater** — walls of alerts or guilt-driven nagging. The accent is a scalpel, not a fire alarm.
- **Don't** put a drop shadow on a resting card, or float a borderless surface — use a hairline.
- **Don't** hardcode colors, use glassmorphism/backdrop-blur in nav or cards, gradient text, or `border-left` colored stripes as accents.
- **Don't** set numerics in the serif or body in the mono — keep the silhouettes in their lanes.
