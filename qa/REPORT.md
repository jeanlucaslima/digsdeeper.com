# digsdeeper QA Report

## Summary

**Overall status:** Pass

The first implementation matches the spec's intent — a quiet research
archive organized around arguments, visually distinct from Aleattorium,
with the essay/note/series content architecture, thesis-first article
shell, metadata rail, feeds, and machine-readable surfaces in place.
Two issues surfaced during the walkthrough; both were fixed and
committed separately. No blocker issues remain.

## Environment

- Local URL: `http://127.0.0.1:4321/`
- Commit hash (after QA fixes): `6b0bbfd`
- Browser: Chrome (via Chrome DevTools MCP)
- Viewports walked: 1440×1000 (desktop), 390×844 (mobile; viewport
  clamped to 500px wide by the MCP host, which is still below the
  880px breakpoint where the article grid collapses)
- Date: 2026-05-18

## Routes tested

- `/`
- `/essays`
- `/essays/why-graphql-now`
- `/notes`
- `/notes/ai-native-media-companies`
- `/notes/community-as-infrastructure` (build-output check only)
- `/series`
- `/series/graphql-at-scale`
- `/series/the-great-arch-of-digitalization` (build-output check only)
- `/about`
- `/feed.xml`
- `/rss.xml`
- `/sitemap.xml`
- `/robots.txt`
- `/llms.txt`

## Findings

### Finding 1 — Listing/About pages had no H1

- **Area:** a11y / SEO heading structure
- **Routes:** `/essays`, `/notes`, `/series`, `/about`
- **Viewport:** all
- **Severity:** High
- **Expected:** Exactly one H1 per page; the H1 is the page title;
  About should not skip from H2 to H3.
- **Actual:** Each page rendered its title inside a `.section-head`
  block as an H2, so `document.querySelectorAll('h1').length === 0`.
  About additionally skipped from H2 (its non-H1 title) directly to H3
  for sub-sections.
- **Evidence:** `qa/screenshots/02-essays-1440.png`,
  `03-notes-1440.png`, `04-series-1440.png`, `05-about-1440.png`;
  MCP `evaluate_script` output showing `h1Count: 0` on every listing
  page and `H2: Title → H3: Sub` on About.
- **Fix:** Added a `.page-head` CSS pattern (eyebrow + H1 + gloss) and
  converted the four affected pages to render their title as a real
  H1 inside it. Promoted About's sub-headings from H3 to H2.
- **Verification:** Post-fix MCP fetch confirmed `h1Count === 1` on
  each page and About now reads H1 → H2 × 4 with no level skips.
  `qa/screenshots/fix1-essays-1440.png`.
- **Commit:** `a11y: give listing and about pages a real H1`

### Finding 2 — `/feed.xml` returned 404

- **Area:** feeds / spec compliance
- **Route:** `/feed.xml`
- **Severity:** High
- **Expected:** `/feed.xml` returns a valid RSS feed. PRD section 22
  and the original product spec both list `/feed.xml` as the canonical
  RSS path.
- **Actual:** Only `/rss.xml` was implemented; `/feed.xml` 404'd.
- **Evidence:** `curl /feed.xml` → 404 (text/html error page) before
  the fix.
- **Fix:** Extracted the RSS builder into `src/lib/rss.ts` and
  parameterized the `atom:link` self path. Added `src/pages/feed.xml.ts`
  as the canonical entrypoint, kept `src/pages/rss.xml.ts` as a
  compatibility alias, and repointed every internal RSS reference
  (Layout `<link rel="alternate">`, header, footer, About, `llms.txt`)
  to `/feed.xml`. Added `/feed.xml` to `sitemap.xml`.
- **Verification:** `curl /feed.xml` → 200 `application/xml`, valid
  channel, `atom:link self="…/feed.xml"`. `curl /rss.xml` still 200
  with its own self-link. Production build emits both files.
- **Commit:** `feeds: serve RSS at /feed.xml as canonical path`

## Acceptance-criteria checklist (PRD §6 + §38)

- [x] Differs from `jeanlucas.me` (subject is the archive, not Jean's
      profile).
- [x] Differs from `aleattorium.com` (deep-teal accent + research-desk
      palette; no orange stamp; no catalog/object grammar).
- [x] Homepage reads as a research archive (hero thesis, featured
      investigation, latest essays / notes, active series — no SaaS
      hero, no card grid).
- [x] Essays organized around thesis. The thesis block renders above
      the body with a labelled rail beside it.
- [x] Notes carry a serious claim block, not a casual blog feel.
- [x] Series pages show central question, status, and a reading path.
- [x] Article pages expose publish + update dates (renders as `—` when
      no update exists, so the field is always present).
- [x] RSS exists at `/feed.xml` (canonical) and `/rss.xml` (alias),
      both well-formed RSS 2.0.
- [x] `sitemap.xml` includes all public routes plus `/feed.xml` with
      `lastmod`.
- [x] `robots.txt` allows everything and points at the sitemap.
- [x] `llms.txt` exists, names digsdeeper, points at /about, active
      series, featured essays, recent notes, and links out to
      jeanlucas.me — no full essays duplicated.
- [x] URLs are clean (`/essays/why-graphql-now`,
      `/notes/<slug>`, `/series/<slug>` — no dates, no extensions).
- [x] Long-form reading is comfortable: Source Serif body at 18px,
      `var(--measure) = 64ch` cap on prose.
- [x] Metadata is visible (rail on desktop, stacked above prose on
      mobile).
- [x] Mobile collapses cleanly: at narrow widths the article grid
      goes single-column and `documentElement.scrollWidth ===
      window.innerWidth` (no horizontal scroll).
- [x] One H1 per page (after Finding 1 fix).
- [x] No console errors (only Vite HMR debug logs during dev).
- [x] No fake or placeholder content; every published piece carries
      a thesis or claim.

## Screenshots

All under `qa/screenshots/`:

- `01-home-1440.png`
- `02-essays-1440.png`
- `03-notes-1440.png`
- `04-series-1440.png`
- `05-about-1440.png`
- `06-essay-1440.png`
- `07-note-1440.png`
- `08-series-detail-1440.png`
- `m01-home-390.png`
- `m02-essay-390.png`
- `fix1-essays-1440.png`

## Remaining risks

- **Web fonts come from Google Fonts CDN.** This is a third-party
  dependency on the reading-experience critical path. Acceptable for
  v1; consider `@fontsource` self-hosting once design is locked.
- **No OG image.** OG metadata is present (title/description/type)
  but no `og:image`, so social shares will fall back to the platform
  default. Worth adding before any wide sharing — likely a small
  text-only card per piece.
- **Chrome MCP viewport clamp.** The host clamped requested 390px and
  320px viewports to 500px wide. Mobile collapse behavior was still
  verified (the article grid breakpoint is at 880px, well above the
  clamp), but the smallest-phone visual was not directly captured.
  Worth a manual check on a real device or in regular Chrome DevTools
  device emulation.
- **No automated test suite.** All QA was manual via Chrome MCP +
  curl. A regression test for "one H1 per page" + "feed.xml returns
  200 valid RSS" would be cheap insurance.
- **`engines.node >= 22.12.0`** in package.json — fine for the author
  but worth noting if CI/hosting environments default to older Node.

## Final recommendation

**Ship.** The two high-severity findings are fixed and committed
separately. The remaining risks are polish/operational, not blockers.
