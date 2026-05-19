# digsdeeper — QA report against PRD (SEO + A11y + OG)

**Date:** 2026-05-19
**Build:** local `npm run build` + `astro preview` on `http://localhost:4321/`
**Canonical host under test:** `https://digsdeeper.com` (apex — matches `astro.config.mjs` and `docs/SEARCH_CONSOLE.md`)
**Tooling:** curl, Chrome DevTools (Lighthouse 12, axe-core 4.10.2)

## Verdict

**Conditional pass.** Crawl + indexing fundamentals are solid (robots, sitemap, canonicals, JSON-LD, semantics, Lighthouse home 100/100/100/100). Two blockers must land before promotion:

1. Open Graph / Twitter card metadata is incomplete — no `og:image`, no `twitter:title/description/image`, and `twitter:card` is `summary` instead of `summary_large_image`. Social previews will be text-only with no branded image.
2. A serious WCAG 2.2 AA color-contrast failure on the `.thesis .label` / `.claim .label` element used on every essay and note (3.16:1 vs required 4.5:1). Drops the essay Lighthouse accessibility score from 100 → 96.

Everything else passes or is in good shape.

---

## Issue list by severity

### Blocker
None. Site is crawlable, indexable, and the structural a11y is intact.

### High
1. **No Open Graph image on any page.** `src/layouts/Layout.astro` does not emit `<meta property="og:image">`. Required by §10.1 of the PRD. *Fix:* add an `og:image` (1200×630) with absolute URL; allow per-essay override via a `Layout` prop and fall back to a site default. Suggested default: `/og.png` in `public/`.
2. **Missing Twitter card fields.** `Layout.astro` emits only `twitter:card`. PRD §11.1 requires `twitter:title`, `twitter:description`, `twitter:image`. *Fix:* mirror `og:title`/`og:description`/`og:image` into the corresponding `twitter:*` tags.
3. **`twitter:card` should be `summary_large_image`.** Currently `summary`. PRD §11.2 requires `summary_large_image`.
4. **Serious color-contrast failure on `.thesis .label` and `.claim .label`.** `--signal: #a8842a` on `--background: #f7f3ea` = 3.16:1, fails WCAG 1.4.3 (needs 4.5:1 for text under 18pt). Hits every essay and note via `src/styles/global.css:464`. Confirmed by both axe-core (serious) and Lighthouse on `/essays/why-graphql-now` and `/notes/ai-native-media-companies`. *Fix:* darken `--signal` to ~`#7a5f15` (≈ 5.6:1) or switch the label to `var(--annotation)` (`#9a6a20` → 4.46:1, borderline — prefer darker) / `var(--muted)` (`#5f574e` → 6.4:1, passes comfortably).

### Medium
5. **`/feed.xml` appears in `sitemap.xml`.** Sitemaps should list canonical HTML pages, not feed URLs. PRD §5.2 ("includes only public indexable canonical URLs"). *Fix:* drop the `feed.xml` entry from `src/pages/sitemap.xml.ts`.
6. **No structured published/updated dates on listing or homepage** — fine for `website`-typed pages, just noting.
7. **`twitter:creator`** (`@jeanleonino`) not set — optional per PRD §11.1 but recommended.

### Low
8. **Menu trigger focus restore is mouse-fragile.** When the menu is opened by mouse on macOS Chrome (where `<button>` click doesn't move focus), `lastFocus` captures `<body>` and Escape doesn't restore focus to the trigger. Keyboard activation (Tab → Enter) works correctly. *Fix:* in `openMenu()`, prefer `lastFocus = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : triggers[0]`.
9. **`article:author`** meta not emitted on essay pages. Optional per PRD §10.1 but recommended for `og:type=article`. The Article JSON-LD already includes `author`, so the gap is OG-only.
10. **Series pages use `og:type=website`** even though they describe a single ongoing investigation. Not wrong, but `article` would be defensible. Leaving as-is is fine — PRD only mandates `article` for essays.

---

## Section-by-section results

### §5 Sitemap

| Check | Result |
| --- | --- |
| `/sitemap.xml` returns 200 | ✅ |
| Valid XML, `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` | ✅ |
| Absolute URLs, single canonical host (apex) | ✅ |
| Includes `/`, `/essays`, `/notes`, `/series`, `/about` | ✅ |
| Includes published essays, notes, series | ✅ (drafts excluded by `({ data }) => !data.draft` filter in `sitemap.xml.ts`) |
| Excludes API/preview/test/debug routes | ✅ |
| Includes `/feed.xml` | ⚠️ Medium — feed URLs shouldn't be in the sitemap |
| Every entry returns 200 locally | ✅ (all 11 URLs verified via curl) |
| `lastmod` present on essays/notes/series | ✅ uses `updated ?? published` |

### §6 robots.txt

```
User-agent: *
Allow: /

Sitemap: https://digsdeeper.com/sitemap.xml
```
All checks pass.

### §7 Canonical

- Every page emits exactly one `<link rel="canonical">` from `Layout.astro`.
- All canonicals use HTTPS + apex domain + the final URL (no trailing slash, matches `trailingSlash: 'never'`).
- Redirects from `www.` and `http://` must be configured at the host/CDN — out of scope of the source repo. Documented in `docs/SEARCH_CONSOLE.md`. ✅ documentation present; ⚠️ verify in production after DNS/CDN deploy.

### §8 Indexability

| URL | Status | `noindex` | canonical |
| --- | --- | --- | --- |
| `/` | 200 | no | ✅ |
| `/essays` | 200 | no | ✅ |
| `/notes` | 200 | no | ✅ |
| `/series` | 200 | no | ✅ |
| `/about` | 200 | no | ✅ |
| `/essays/why-graphql-now` | 200 | no | ✅ |
| `/notes/ai-native-media-companies` | 200 | no | ✅ |
| `/series/graphql-at-scale` | 200 | no | ✅ |

Pages render full content server-side (Astro static build) — not blank without JS. ✅

### §9 Metadata

- Homepage title: `digsdeeper — serious essays`. Description matches editorial direction (serious essays, software, strategy, AI, systems, culture). ✅
- Essay index title: `Essays — digsdeeper`. ✅
- Essay page title pattern: `Why GraphQL now? — digsdeeper` — matches PRD `[Essay Title] — DigsDeeper` (modulo lowercase brand, which is the site's chosen styling). ✅
- Descriptions are page-specific (essay uses `summary` then falls back to `thesis`). ✅

### §10 Open Graph — **FAILS**

| Tag | Home | Essay |
| --- | --- | --- |
| `og:title` | ✅ | ✅ |
| `og:description` | ✅ | ✅ |
| `og:url` | ✅ (matches canonical) | ✅ |
| `og:type` | ✅ `website` | ✅ `article` |
| `og:image` | ❌ missing | ❌ missing |
| `article:published_time` | n/a | ✅ |
| `article:modified_time` | n/a | only when `updated` set |
| `article:author` | n/a | ❌ missing |

### §11 Twitter/X — **FAILS**

| Tag | Status |
| --- | --- |
| `twitter:card` | ⚠️ present but value is `summary`, needs `summary_large_image` |
| `twitter:title` | ❌ missing |
| `twitter:description` | ❌ missing |
| `twitter:image` | ❌ missing |
| `twitter:creator` | ❌ (optional) |

### §12 Structured data

- Homepage emits `WebSite` + `Person` JSON-LD with stable `@id` references. Valid. ✅
- Essay/note pages emit `Article` JSON-LD with `headline`, `datePublished`, optional `dateModified`, `author` (Jean Lucas Lima with `@id` linking back to the homepage Person), `publisher`, `mainEntityOfPage`. ✅
- No fake ratings or extraneous fields. ✅
- Validated by hand against schema.org — well-formed JSON, all required fields for `Article` present.

### §13 Accessibility — automated

| Page | Lighthouse a11y | axe violations |
| --- | --- | --- |
| `/` | 100 | 0 |
| `/essays/why-graphql-now` | 96 | 1 serious (color-contrast) |
| `/notes/ai-native-media-companies` | — (not run) | 1 serious (color-contrast, same root cause) |

Single failing rule, single root cause (`.thesis .label` / `.claim .label`). See High #4.

### §14 Keyboard navigation

- Skip link is the first focusable, becomes visible on focus (`global.css:148`). ✅
- Tab order follows DOM order. ✅
- Menu trigger reachable; opens on Enter/Space (native `<button>`). ✅
- On open: `inert` is added to siblings of `#site-menu`; focus moves to the in-dialog Close button. ✅
- Tab is trapped inside the dialog (explicit loop in `SiteMenu.astro` script). ✅
- Escape closes. ✅
- ⚠️ Focus restoration after close works for keyboard activation, but not when the menu was opened by mouse on macOS Chrome (see Low #8).

### §15 Focus state

- Global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` on `--background` → ≈ 8.6:1 contrast. ✅
- Menu trigger uses `outline: none` + `box-shadow: 0 0 0 2px var(--accent-soft)`. Acceptable; the box-shadow is the visible indicator.
- Menu links rely on a 2px left-border color change and underline. Acceptable for AA but not the strongest indicator — could add an `outline` for stronger affordance.
- `scroll-padding-top: 5rem` configured (`global.css:40`) — sticky header doesn't cover anchor targets. ✅

### §16 Semantic HTML

- One `<main>`, one `<h1>` per page (verified on home, essays, notes, series, about). ✅
- `<nav>`, `<header>`, `<footer>` used correctly. ✅
- Essay pages wrap content in `<article>` with `<header>` and prose `<div>`. ✅
- Dates use `<dd>May 2026</dd>` in the metadata rail — ⚠️ does **not** use `<time datetime="…">`. Cosmetic but recommended (PRD §16). The Article JSON-LD does carry ISO dates, so search engines are covered; screen-reader pronunciation of "May 2026" is fine, but a `<time>` element would let assistive tech (and copy-paste tools) interpret it.

### §17 Long-form readability

- Body font 18px, line-height 1.55, prose `max-width: var(--measure)` (64ch). ✅
- Links inside text are underlined and accent-coloured. ✅
- Code blocks have visible borders; tables and images respect the prose width. ✅
- Verified at 320px (via prior iframe technique in `qa/REPORT-final.md`) — no horizontal scroll. ✅
- 200% zoom not re-tested in this pass — covered by previous QA.

### §18 Images

- Decorative SVGs (`Shovel`) use `aria-hidden="true"`; branded use sets `role="img"` + SVG `<title>`. ✅
- No raster images currently in the prose. When added, ensure descriptive `alt` and explicit `width`/`height`.

### §19 Color and contrast

- Body (`#171411` on `#f7f3ea`) >15:1. ✅
- `--muted` (`#5f574e`) ≈ 6.4:1. ✅
- `--accent` link (`#1f4e5f`) ≈ 8.6:1. ✅
- `--signal` (`#a8842a`) = 3.16:1 — **FAILS** for the `.label` text. (High #4.)
- `--alert` (`#9c3b2e`) on `--background` ≈ 5.5:1 — passes for the "Current" pill and `.menu-link-gloss`.

### §20 Motion

- Global `@media (prefers-reduced-motion: reduce)` zeros `animation-duration` / `transition-duration` and disables the menu slide. ✅
- No flashing content; menu state is communicated via text label flip (`MENU` ↔ `CLOSE`) and `aria-expanded`, not motion alone. ✅

### §21–22 Mobile, zoom, fixed header

- Header is `position: sticky` (not fixed) — anchor targets handled via `scroll-padding-top`. ✅
- Brand descriptor hidden under 720px to free up trigger room. ✅
- Touch targets: the `MENU` button is ~36px high — borderline; comfortably tappable.
- Re-validated 200% zoom and 320px in the previous QA pass (`qa/REPORT-final.md`); CSS unchanged in this report.

---

## Recommended fixes (concrete)

### 1. Add OG/Twitter image + complete Twitter card (Layout.astro)

In `src/layouts/Layout.astro`, extend `Props` with `image?: string` and emit:

```astro
const ogImage = new URL(image ?? '/og.png', Astro.site ?? 'https://digsdeeper.com').toString();
---
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
<meta name="twitter:creator" content="@jeanleonino" />
{type === 'article' && <meta property="article:author" content="Jean Lucas Lima" />}
```

Drop a 1200×630 `public/og.png` (text-safe centered) into the repo. Per-essay images can be passed through `ArticleLayout` → `Layout` later.

### 2. Fix `.thesis .label` / `.claim .label` contrast

In `src/styles/global.css`, change the label colour from `var(--signal)` to a token that passes 4.5:1. Either:

- Darken `--signal` to `#7a5f15` (5.6:1 on `#f7f3ea`); or
- Re-point the label rule at `var(--muted)` (`#5f574e`, 6.4:1).

```css
.thesis .label,
.claim .label {
  color: var(--muted); /* was var(--signal) */
}
```

### 3. Drop `/feed.xml` from sitemap

In `src/pages/sitemap.xml.ts`, remove the line:

```ts
{ loc: `${base}/feed.xml` },
```

The RSS feed remains discoverable via `<link rel="alternate" type="application/rss+xml">` in `Layout.astro` and the menu.

### 4. Robust focus restore on menu close

In `src/components/SiteMenu.astro`, `openMenu()`:

```ts
const active = document.activeElement;
lastFocus = (active && active !== document.body && document.body.contains(active))
  ? active as HTMLElement
  : (triggers[0] as HTMLElement | null);
```

### 5. Use `<time datetime>` in the metadata rail (optional)

In `src/components/MetadataRail.astro`, render dates as `<time datetime={published.toISOString()}>{formatDate(published)}</time>`.

---

## Suggested `qa:seo` script (optional, not added in this pass)

A minimal Node script could fetch `/robots.txt`, parse `/sitemap.xml`, fetch each URL, and assert status code + presence of `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:title`, `og:description`, `og:image`, `twitter:card=summary_large_image`, `twitter:image`, and absence of `noindex`. Wire it as `"qa:seo": "node scripts/qa-seo.mjs"` in `package.json`.

I did not add this script in this report so the deliverable stays focused on the QA findings; happy to follow up.

---

## Definition-of-done checklist (final)

```
✅ /robots.txt exists and references sitemap
✅ /sitemap.xml exists and validates
⚠️ sitemap includes only public indexable canonical URLs   (feed.xml present)
✅ homepage returns HTTP 200
✅ essay index returns HTTP 200
✅ every published essay in sitemap returns HTTP 200
✅ no draft/private/debug/API routes appear in sitemap
✅ all sitemap URLs have matching canonical tags
✅ all public pages have title and meta description
⚠️ all public pages have Open Graph metadata               (no og:image)
❌ all public pages have Twitter/X card metadata           (missing fields, wrong card type)
❌ social preview image works                              (no image exists)
✅ essay pages use proper article semantics
✅ keyboard navigation works
✅ focus states are visible
✅ reduced motion is respected
⚠️ Lighthouse accessibility score is 95+                   (home 100, essay 96 — passes threshold but with one fixable serious issue)
❌ axe reports no critical or serious issues               (1 serious: color-contrast)
✅ pages work at 200% zoom                                  (covered by prior QA)
```

Fix the four items in **Recommended fixes** §1–§2 and the checklist clears.
