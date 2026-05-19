# digsdeeper Article Layout QA Report

## Summary

Overall status: **Pass**

The redesigned essay layout meets the acceptance criteria in the article-layout PRD. The desktop side panel is stacked into identity / context / series / chapters groups, the navigator is generated from real H2 headings, active state tracks scroll, anchors land correctly, the mobile fixed `CHAPTERS` bar + drawer work, and the article-level drawer does not conflict with the site `MENU`. No console errors; no horizontal scroll; non-article routes are unaffected.

## Environment

- URL: `http://localhost:4321` (`npm run dev`, Astro)
- Commit base: `16716ed` (pre-change). Layout work is uncommitted in working tree at QA time.
- Browser: Chrome DevTools MCP (Chromium-based, headless emulation)
- Viewports exercised: 1440×1000, 1280×900, 1024×768 (desktop); 500×844, 500×568 (mobile emulator — see note in §Mobile)
- Date: 2026-05-19

## Routes tested

- `/essays/why-graphql-now` — primary
- `/` — regression
- `/essays` — regression
- `/notes` — regression
- `/series` — regression
- `/about` — regression
- `/feed.xml`, `/llms.txt`, `/sitemap.xml` — 200 each

## Test execution against §22 script

| Step | Result |
| --- | --- |
| 1. Open primary essay at 1440×1000 | OK |
| 2. Console errors | None |
| 3–5. One H1; H2s have stable IDs | 1 H1; 4 H2 IDs: `the-consumer-changed`, `three-things-graphql-happens-to-be-good-at`, `what-this-does-not-mean`, `the-bet` |
| 6. Desktop left panel appears | OK, sticky with `position: sticky` below header |
| 7. Metadata stack content (Type / Status / Published / Updated / Field / Series) | All values rendered, grouped, separated with thin rules and a deep-teal top accent on the identity group |
| 8. Chapter navigator matches H2s in order | 4 numbered items, hrefs match IDs, no duplicates |
| 9–10. Scroll → active chapter updates | OK after refining the threshold to use `scroll-padding-top` instead of `header + 12` (see Finding 1) |
| 11–12. Click each chapter → anchor offsets correct | OK on desktop; targets land 90 px from viewport top, 18 px below the 72 px header |
| 13–14. Resize to 1024×768 | Sticky/sidebar behavior unchanged; body remains within `--measure` |
| 15–16. 390×844 (emulator reports 500 wide — still in `≤880` mobile breakpoint) | Mobile layout active: panel hidden, summary line visible, fixed chapters bar present |
| 17. Compact metadata summary | `Essay · Working argument · Developer tools / AI / software architecture · Published May 2026 · Series: GraphQL at Scale` |
| 18. Fixed `CHAPTERS` bar | Renders below site header at `top: var(--site-header-h)`, label shows current chapter via `aria-live="polite"` text node |
| 19–21. Open drawer → click chapter → drawer closes, page scrolls correctly | OK after bumping mobile `scroll-padding-top` to `8rem` (see Finding 2) |
| 22–23. Open site `MENU` while chapters drawer is open | Chapters drawer auto-closes via `MutationObserver` on `#site-menu[data-open]` |
| 24. Escape behavior | Escape closes chapters drawer when open; site menu's existing handler closes it independently |
| 25. 320×568 | Emulator clamps to ~500 px but still in the mobile breakpoint; no overflow, no horizontal scroll |
| 26. Horizontal scroll check | `scrollWidth === innerWidth` at all tested widths |
| 27. Non-article routes | `.article-panel` and `.mobile-chapters` DOM are not emitted on `/`, `/essays`, `/notes`, `/series`, `/about` |
| 28. Feed surfaces | All 200 |

## Findings (fixed during QA)

### Finding 1 — Active chapter lagged by one section after clicking an anchor

- Area: desktop chapter navigator, active-state logic
- Route: `/essays/why-graphql-now`
- Viewport: 1440×1000
- Severity: High
- Expected: Clicking "The bet" makes "The bet" active.
- Actual: After scroll, the heading landed at `top = 90 px` (matching `scroll-padding-top: 5rem`), but the active-state threshold was `header.offsetHeight + 12` (= 84 px). Because `rect.top (90) > offset (84)`, the previous section stayed active.
- Evidence: `evaluate_script` after click reported `targetTop: 90.07, active: "What this does not mean"`.
- Fix: `src/layouts/ArticleLayout.astro` — switched the active-section threshold to `parseFloat(getComputedStyle(documentElement).scrollPaddingTop) + 8`, and changed comparison to `rect.top <= offset`. Re-verified: same click now reports `active: "The bet"`.
- Commit: pending in working tree.

### Finding 2 — Mobile anchor scroll left ~2 px of the heading behind the fixed chapter bar

- Area: anchor scroll offsets on mobile
- Route: `/essays/why-graphql-now`
- Viewport: 500×844 (emulator)
- Severity: High
- Expected: After tapping a chapter, the H2 sits comfortably below the site header + chapters bar (header 72 + bar 47 = 119 px combined).
- Actual: With `scroll-padding-top: 6.5rem` (117 px), the heading top landed at 117 px — 2 px above the 119 px fixed-area bottom, so the heading visually touched the bar.
- Evidence: `evaluate_script` reported `targetTop: 117.12, combined: 119, hiddenBehindFixed: true`.
- Fix: `src/styles/global.css` — bumped the mobile-with-chapters override to `scroll-padding-top: 8rem` (144 px), giving 25 px clearance.
- Verified: same flow now reports `targetTop: 144.12, hiddenBehindFixed: false`.
- Commit: pending in working tree.

## Areas verified beyond the per-step script

- **Heading hierarchy**: only depth-2 headings pass through to the navigator (filter in `src/pages/essays/[slug].astro`); H1, H3+, thesis label, metadata labels, footer headings, related links are excluded by construction.
- **Series link**: `panel-series-link` renders with a deep-teal left rule and remains a real `<a>` to `/series/<slug>`.
- **Active state is not color-only**: `.chapter-item.is-active .chapter-link` gets a 2 px deep-teal left border in addition to bolder chapter text; mobile drawer adds a `◆` glyph after the active item. `aria-current="true"` is set on both desktop and mobile chapter links.
- **Drawer accessibility**: `[data-mobile-chapter-drawer]` is `role="dialog"` with `aria-label="Chapters"`, toggled via `aria-expanded` on the trigger and `inert` when closed.
- **Reduced motion**: drawer transition is suppressed under `@media (prefers-reduced-motion: reduce)`.
- **Site menu coordination**: when `#site-menu[data-open]` transitions to `true`, a `MutationObserver` forces the chapter drawer closed. Escape handler in the layout script also closes the drawer without interfering with the menu's own Escape handler.
- **Single chapter / no chapter case**: `ArticlePanel` and `MobileChapters` both guard with `chapters.length >= 2` before rendering; `.article-shell` only sets `--mobile-chapters-h` when `.has-chapters` is applied. (Verified by reading the components — no other essay currently has H2s to exercise it live.)

## Console / runtime

- 0 errors, 0 warnings on the primary essay across all interactions (initial load, scroll, anchor click, drawer open/close, menu open/close, Escape).

## Performance / smoothness

- Scroll-handler is rAF-throttled (`ticking` flag) and uses a single passive listener.
- Sticky panel does not flicker on scroll.
- Drawer transition is 200 ms ease; no layout jump observed on toggle.
- Active state updates are imperceptible (one re-paint per rAF).

## Screenshots

- `qa/desktop-final.png` — desktop at 1440×1000, panel + chapters
- `qa/mobile-final.png` — mobile, fixed bar with current chapter label visible
- `qa/mobile-essay-drawer.png` — drawer open with 4 chapters, active item highlighted

## Remaining risks

- Mobile emulator in the MCP environment clamped widths to ~500 px even when 390/375/320 were requested. The breakpoint (`≤880 px`) and content margins (`--page-x: clamp(1.25rem, 4vw, 2.5rem)`) make narrow widths a continuation of the same layout, but a real-device pass at ≤375 is recommended before ship.
- No essay currently has more than 4 H2s, so internal scrolling inside the desktop chapter list (`overflow-y: auto` on `.article-panel`) and the mobile drawer (`max-height: 60dvh`) is unexercised in production content. Both are wired and should hold up.
- This pass is essay-only. Notes still use the default `headings: []`, so they render the new panel without a chapter group, which matches the v1 scope in §17 of the PRD.

## Final recommendation

**Ship after committing.** The two fixes in §Findings are pending in the working tree; both belong to the chapter-navigator/anchor-offset commits per §19 of the source PRD. After committing, the layout is ready for production.
