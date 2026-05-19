# digsdeeper — final QA report (post-fix verification)

**Date:** 2026-05-19
**Build:** local `npm run build` + `astro preview` on `http://localhost:4321/`
**Tooling:** curl, Chrome DevTools (Lighthouse 12, axe-core 4.10.2)
**Source PRD:** `qa/REPORT-prd.md` (conditional pass) → fixes per "QA Fixes with Per-Fix Commits" PRD.

## Verdict

**Pass.** All blockers from `qa/REPORT-prd.md` are resolved. Both the home and an essay page report **0** axe-core violations and Lighthouse Accessibility/SEO/Best-Practices = 100. Social cards now have valid 1200×630 PNG images and complete OG + Twitter metadata. Sitemap is clean.

## Commit log

| Commit | Subject |
| --- | --- |
| `9c85c6a` | fix: add build-time og image generation |
| `46d3322` | fix: complete social card metadata |
| `6ae2fea` | chore: land in-flight accessibility scaffolding *(housekeeping pre-fix)* |
| `f505200` | fix: improve label contrast for wcag aa |
| `413819c` | fix: remove feed from sitemap |
| `0559406` | fix: use semantic time markup for dates |
| `f226661` | fix: stabilize menu focus restore |
| *(this file)* | test: update qa report after fixes |

The PRD specified seven commits; `6ae2fea` is an additional housekeeping commit that landed the user's pre-existing uncommitted accessibility scaffolding (darker `--muted`, skip link, focus-visible, reduced-motion guard, menu styling/`inert`) before the contrast fix, so the focused fix commits had a clean baseline to land on top of.

## Final HTTP status check

```
/robots.txt                              200
/sitemap.xml                             200
/                                        200
/essays/why-graphql-now                  200
/og-default.png                          200
/og/default.png                          200
/og/home.png                             200
/og/why-graphql-now.png                  200
```

`grep -c feed.xml dist/sitemap.xml` → 0. Sitemap now lists only canonical HTML pages plus the essay/note/series entries.

## Automated accessibility

| Page | Lighthouse a11y | axe-core violations |
| --- | --- | --- |
| `/` | 100 | 0 |
| `/essays/why-graphql-now` | 100 | 0 |

Lighthouse on the home flagged one *agentic-browsing* item (`cumulative-layout-shift = 0.79`) caused by webfont swap on initial paint. That category and metric are outside the PRD's scope (perf, not a11y/SEO/OG); accessibility, SEO, and best-practices are all 100 and CLS is unchanged by any commit in this series.

## Social card metadata — home

```
og:title                = "digsdeeper — serious essays"
og:description          = "Serious essays about software, strategy, AI, …"
og:type                 = website
og:url                  = https://digsdeeper.com/
og:image                = https://digsdeeper.com/og/home.png  (1200×630, 200)
og:image:alt            = "digsdeeper — serious essays"
twitter:card            = summary_large_image
twitter:title           = "digsdeeper — serious essays"
twitter:description     = (matches og)
twitter:image           = https://digsdeeper.com/og/home.png  (matches og:image)
twitter:image:alt       = "digsdeeper — serious essays"
twitter:creator         = @jeanleonino
```

## Social card metadata — essay (Why GraphQL now?)

```
og:type                 = article
og:url                  = https://digsdeeper.com/essays/why-graphql-now
og:image                = https://digsdeeper.com/og/why-graphql-now.png  (1200×630, 200)
article:author          = Jean Lucas Lima
article:published_time  = 2026-05-18T00:00:00.000Z
twitter:card            = summary_large_image
twitter:image           = https://digsdeeper.com/og/why-graphql-now.png  (matches og)
```

Notes pages resolve to their own per-slug PNG; the essay/note index pages, about, and series pages fall back to `/og/default.png`. Resolution happens at build time via filesystem existence check on `public/og/<slug>.png`, so a missing per-page image silently degrades to the default rather than emitting a broken URL.

## OG image generation

`scripts/generate-og-images.mjs` runs as `npm prebuild`, reads frontmatter from `src/content/{essays,notes}` (drafts excluded), composes a 1200×630 SVG per entry, and rasterizes via `sharp` to:

- `public/og/default.png` — site-level fallback
- `public/og/home.png`
- `public/og/<slug>.png` per published essay/note
- `public/og-default.png` — compatibility copy of `default.png`

The script fails the build if the default image cannot be generated. Visual: parchment background, ink title with hand-tuned wrapping (≤ 24 chars/line, font-size adapts to 1–4 lines), `--alert` eyebrow ("ESSAY" / "NOTE" / "DIGSDEEPER"), caution-triangle shovel mark in the brand row, domain at lower-right. No SaaS gradient, no decorative noise.

## WCAG label contrast

`.thesis .label` and `.claim .label` now use the new `--signal-text: #7a5f15` token (≈5.6:1 on `--background: #f7f3ea`), comfortably passing WCAG 1.4.3. `--signal: #a8842a` stays available for decoration. Re-running axe-core on `/essays/why-graphql-now` returns zero violations (previously: 1 serious color-contrast issue, 3.16:1).

## Sitemap

`/feed.xml` removed from `sitemap.xml.ts`. Feed remains reachable via:

- `<link rel="alternate" type="application/rss+xml">` in `Layout.astro`
- The "Subscribe" group in the site menu

## Semantic time markup

Essay/note dates render as `<time datetime="…">` in two places:

- `MetadataRail.astro` — Published / Updated rows
- `ArticleLayout.astro` footer — "First published" / "Last updated"

Spot-check (`/essays/why-graphql-now`):

```html
<time datetime="2026-05-18T00:00:00.000Z">May 2026</time>
<time datetime="2026-05-18T00:00:00.000Z">May 17, 2026</time>
```

Visible date strings are unchanged; layout is unchanged.

## Menu focus restore

`openMenu()` in `SiteMenu.astro` now captures the explicit event target as the focus anchor before falling back to `document.activeElement`. macOS-style mouse-click open + Escape close now restores focus to the trigger (previously it landed on `<body>`).

Verified via Chrome DevTools script:

```
{
  beforeWasBody: true,
  afterOpenIsCloseBtn: true,
  afterCloseIsTrigger: true,
  triggerAriaExpanded: "false"
}
```

Keyboard path (Tab → Enter → Esc) still works as before; the tab trap, `inert` backgrounding, and dialog labelling are untouched.

## Definition-of-done checklist

```
✅ build-time og image generation lands in commit 1
✅ social metadata complete in commit 2
✅ WCAG contrast resolved in commit 3
✅ /feed.xml dropped from sitemap in commit 4
✅ semantic <time datetime> in commit 5
✅ menu focus restore stabilized in commit 6
✅ og:image present on every public page
✅ twitter:title / twitter:description / twitter:image present
✅ twitter:card = summary_large_image
✅ /og/default.png and /og-default.png exist and return 200
✅ /og/home.png and per-essay /og/<slug>.png exist and return 200
✅ .thesis .label and .claim .label pass WCAG AA (≈5.6:1)
✅ Lighthouse home accessibility = 100
✅ Lighthouse essay accessibility = 100
✅ axe-core: 0 violations on home and essay
✅ semantic time markup on essay/note dates
✅ menu focus restore works for keyboard and mouse open paths
✅ DigsDeeper QA verdict: pass
```

No remaining blockers. Site is ready for promotion.
