# Home Page Overrides

> ⚠️ **STALE — superseded by root `DESIGN.md`.** These page overrides predate the "Ledger" precision design system and no longer reflect the shipping UI. Use `DESIGN.md` as the single source of truth.


> **PROJECT:** CanvasBuddy — widget dashboard

- **Layout:** Fixed unit grid — 4 columns on `md+`, 2 columns on small screens. Row height `--home-unit-h` (7.5rem). Widget footprints are preset only: 1×1, 1×2, 2×1, 2×2, 2×3 (catalog `defaultSize`).
- **New-user default:** All grades (2×2), course grade, missing, unweighted/weighted GPA, coming up (7 days, 2×2), due tomorrow (2×1), timezone, AI helper.
- **Storage:** Each widget has canonical `col` (0–3) and `row` in 4-column space; mobile repacks for display without changing stored positions.
- **Customize:** Drag to move (desktop only), remove (X), **Add widget** modal. **+/−** on large widgets to resize (e.g. All grades 2×1–2×3). **Settings** on All grades, Course grade, Coming up (days 1–30). Cancel restores snapshot; Done persists.
- **All grades:** 2×1 = 2 courses, 2×2 = 4, 2×3 = 6; no internal scroll. Size stored in layout.
- **Coming up:** Per-widget `days` in config; filters assignments client-side.
- **Due tomorrow list:** Empty state fills full 2×2 cell height.
- **Components:** `WidgetGrid`, `WidgetPickerModal`, `WidgetPreviewCard`, `WidgetRenderer` (optional `preview` mode)
