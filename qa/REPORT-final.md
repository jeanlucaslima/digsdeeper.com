# digsdeeper QA Report — Final Pre-Promotion Pass

This addendum runs after the original QA report (`qa/REPORT.md`) and
covers the four pre-promotion deliverables required by the final-pass
PRD: Fontsource migration, unified shell/margins, full-screen archive
menu, and a true narrow-mobile verification.

## Summary

**Overall status:** Ship.

All four pre-promotion gates from the final-pass PRD are met. Three
separate, rollback-friendly commits land the shell, menu, and visual
polish on top of the Fontsource commit. Production build emits 11
routes cleanly.

## Environment

- Local URL: `http://127.0.0.1:4321/`
- Commit hash (after final polish): `873d4fa` (this report commits on top)
- Browser: Chrome via Chrome DevTools MCP
- Viewports walked: 1440×1000 (desktop), 390×844 (MCP-clamped to 500
  wide), and a real 318×568 render inside a same-origin iframe to
  bypass the MCP viewport clamp documented in the previous report.
- Date: 2026-05-18

## Pre-promotion gates

### 1. Fontsource migration

Covered in commit `typography: set up Google Sans through Fontsource`.
Zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`; six
local woff2 files (Latin + Latin-Ext × 400/500/600) bundle into
`/_astro/`. All three font-role tokens point at Google Sans behind a
shared `--font-sans` stack.

### 2. Unified shell / margins

Covered in commit `Margins: unify digsdeeper page shell across routes`.

- `series/[slug].astro` was rewritten to use the same `.page-head`
  pattern as the other listing/utility pages and the existing
  `ThesisBlock` component for the central question, instead of its
  previous six-inline-styles header.
- `ThesisBlock` and `ArticleLayout`'s "Continues" / "Series" footers
  no longer use inline `style="..."`. The corresponding rules moved
  into `global.css` (`.thesis p`, `.claim p`, `.article footer.trail
  .trail-group`, `.meta-row`, `.reading-path`).
- `<main>` gained a 3rem bottom padding so the footer breathes the
  same way on every route.

DOM scan across `/`, `/essays`, `/essays/why-graphql-now`, `/notes`,
`/notes/ai-native-media-companies`, `/series`,
`/series/graphql-at-scale`, and `/about`: every route now reports
exactly one H1 and zero elements with the `style` attribute.

### 3. Full-screen archive menu

Covered in commit `Navigation: add full-screen archive menu`.

- New `SiteMenu.astro` component renders three labelled groups
  (Archive, Feeds, Elsewhere) of 10 links total inside the same
  `.container` shell as the rest of the site.
- `SiteHeader.astro` now renders the brand + "Research archive"
  descriptor on the left and a text-only `MENU` / `CLOSE` button on
  the right. No hamburger icon.
- Client behavior verified end-to-end through MCP:
  - Closed state: trigger label `MENU`, `aria-expanded="false"`,
    `menu[hidden]`, `aria-hidden="true"`.
  - Opened by clicking trigger: label flips to `CLOSE`,
    `aria-expanded="true"`, `html.menu-open` class added,
    `body.style.overflow = "hidden"`, three groups + 10 links
    rendered, `.menu-current` pill visible on the route that matches
    the current URL, `document.activeElement` is the first menu link.
  - `Escape` keydown closes: label `MENU`, scroll lock released,
    menu hidden.
- Active route uses both a left-rule and an explicit "Current" pill,
  so the active state does not rely on color alone.
- `prefers-reduced-motion: reduce` removes the fade-in animation.

### 4. Narrow mobile verification

The previous report noted that the MCP host clamps requested 390px
and 320px viewports to 500px wide. To clear that, I rendered the site
inside a same-origin 320px-wide iframe (browser-real 318px usable
width after the 1px iframe border each side) and queried the iframe's
own `window.innerWidth`, computed styles, and scroll dimensions.

Results at `width=318px`:

- `/`: no horizontal scroll, 1 H1, footer grid collapses to a single
  column, the brand descriptor is hidden by the 720px media query,
  menu trigger is present, body font stays at 18px, hero H1 renders
  at 40.5px (no comical scale on phones).
- `/essays/why-graphql-now`: no horizontal scroll, 1 H1,
  `.article` grid collapses to a single column, the metadata rail's
  `position` switches from `sticky` to `static`, and the thesis block
  stays visible above the prose.

## Routes tested

- `/`
- `/essays`, `/essays/why-graphql-now`
- `/notes`, `/notes/ai-native-media-companies`
- `/series`, `/series/graphql-at-scale`
- `/about`
- `/feed.xml` (200, `application/xml`)
- `/rss.xml` (200, `application/xml`)
- `/llms.txt` (200, `text/plain`)
- `/sitemap.xml` (200, `application/xml`)
- `/robots.txt` (200, `text/plain`)

## Findings during this pass

None blocking. Three issues found by the earlier round (no H1 on
listings, `/feed.xml` 404, third-party font CDN) were already fixed
in prior commits. The shell, menu, and polish commits in this pass
were proactive refinements, not bug fixes.

## Screenshots

All under `qa/screenshots/`. Additions in this pass:

- `shell-series-1440.png` — series detail page after shell refactor.
- `menu-closed-1440.png` — header with closed `MENU` trigger.
- `menu-open-1440.png` — full-screen archive menu, desktop.
- `menu-open-mobile.png` — full-screen archive menu, narrow viewport.
- `pre-polish-home-1440.png` / `pre-polish-essay-1440.png` — state
  before the final visual polish commit.
- `polish-home-1440.png` — homepage after polish (annotation-style
  featured block, three-column footer, tighter hero).
- `final-home-mobile.png` — homepage at the MCP-clamped 500px width.
- `final-iframe-320.png` / `final-iframe-essay-320.png` — real 318px
  render inside an iframe to bypass the MCP clamp.

## Acceptance checklist

- [x] Header, body, footer, and menu share consistent width / margins
      (every page wraps in `.container` with `--page-x` padding).
- [x] Mobile margins verified at a true 318px viewport.
- [x] `MENU` exists on desktop and mobile.
- [x] No hamburger icon exists.
- [x] Full-screen menu works as archive index.
- [x] Menu uses digsdeeper's quiet research visual language
      (paper background, accent rules, no orange stamp, no cards).
- [x] Body scroll locks while menu is open.
- [x] Escape closes the menu.
- [x] Keyboard navigation works (focus moves to first link on open,
      focus-visible ring on every interactive element).
- [x] Essay / note / series architecture unchanged.
- [x] RSS, sitemap, robots, llms.txt all 200.
- [x] No route regresses to zero H1.
- [x] No console errors (only Vite HMR debug log in dev).
- [x] Visual identity remains clearly distinct from Aleattorium
      (deep-teal accent, no orange, no catalog grammar, no variable
      logo, no full-screen menu stamp aesthetic — the menu reuses the
      interaction signature but renders as a quiet research index).
- [x] Each change committed separately with verbose rollback notes.
- [x] Production build emits 11 routes with no warnings.

## Remaining risks (unchanged from original report unless noted)

- **No OG image.** Still missing per-route Open Graph images. Worth
  adding a small text-only card before any wide sharing.
- **No automated tests.** A handful of regression tests would be
  cheap insurance (`/feed.xml` returns 200 with `application/xml`;
  every public route has exactly one H1; the menu trigger toggles
  `aria-expanded`).
- **`engines.node >= 22.12.0`** in `package.json` — same note as
  before.

The "Google Fonts CDN" and "MCP narrow-mobile clamp" risks from the
previous report are resolved (Fontsource commit + iframe-based 318px
verification).

## Final recommendation

**Ship.** All four pre-promotion gates are met. Pushing the branch
to `origin/main`.
