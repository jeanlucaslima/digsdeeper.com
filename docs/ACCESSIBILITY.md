# Accessibility — digsdeeper.com

Target: WCAG 2.2 AA. Optimized for long-form reading.

## What's in place

### Structure & landmarks
- Every page has exactly one `<h1>` — essays and notes use the entry title (`ArticleLayout.astro`); listing/utility pages use a `.page-head h1`.
- `<main id="main" tabindex="-1">` (`Layout.astro`), `<header>` (`SiteHeader.astro`), `<footer>` (`SiteFooter.astro`).
- Essays/notes use `<article class="article">` with a header, prose body, and trail footer.
- Article metadata is in an `<aside aria-label="Metadata">` rail (`MetadataRail.astro`) using `<dl>` for term/value pairs.
- Menu nav uses `aria-label="Contents"`; footer groups are `<section>` with `<h2 class="site-footer-label">`.

### Skip link
- `Layout.astro` renders `<a href="#main" class="skip-link">Skip to content</a>` as the first focusable element.
- `.skip-link` is offscreen until focused (`global.css`).
- `html { scroll-padding-top: 5rem; }` keeps the sticky header from covering anchor targets when jumping or skipping.

### Keyboard & focus (menu)
- Trigger and close are native `<button>`s.
- `#site-menu` is `role="dialog" aria-modal="true"` with `aria-labelledby="site-menu-heading"`.
- Opening:
  - Stores the previously focused element.
  - Adds `inert` to every other top-level child of `<body>` (header, main, footer) → background is hidden from AT and removed from tab sequence.
  - Moves focus to the in-dialog Close button.
- Tab is trapped inside the dialog (`SiteMenu.astro` script).
- Escape closes; focus is restored to the previously focused element (header trigger by default).
- Global `:focus-visible` shows a 2px accent outline.

### Reduced motion
- `@media (prefers-reduced-motion: reduce)` zeros animation/transition durations globally and disables the menu slide transition.

### Color contrast (WCAG AA)
- Body `--ink` (#171411) on `--background` (#f7f3ea) → > 15:1.
- `--muted` (#5f574e) on `--background` → ≈ 6.4:1 (passes for normal text).
- Links use `--accent` (#1f4e5f) on `--background` → ≈ 8.6:1; underlined by default (`text-decoration: underline`).

### Long-form essay optimizations
- 18px base, 1.55 line-height, `max-width: var(--measure)` (64ch) on `.prose` and the article body.
- Links inside essays inherit the global `<a>` style: underlined and accent-colored — visually distinct from surrounding text, satisfying SC 1.4.1 (Use of Color).
- Blockquotes and code blocks have visible borders and high-contrast backgrounds.
- Code blocks are scrollable with the keyboard; pre containers are reachable in tab order via natural document flow.

### Footnotes / endnotes
- None present in current content. When added (e.g. markdown footnotes via remark-footnotes), both directions render as `<a href="#fn-1">` / `<a href="#fnref-1">` — they will be keyboard-reachable by default. Verify the back-link has a meaningful accessible name (the default `↩` only is insufficient — set `aria-label="Back to text"`).

### Images
- `Shovel.astro` is decorative by default (`aria-hidden="true"`); when used as the brand mark it can take a `title` prop, in which case it becomes `role="img"` with an SVG `<title>`.

### Color-only / hover-only
- No interactive behavior depends on hover only (every nav surface is reachable via Tab; current page is announced via `aria-current="page"` and a visible "Current" badge, not only via border color).
- No semantic meaning is encoded in color alone; status labels are text.

### Layout & zoom
- Fluid type (`clamp()`), grid fallbacks at `max-width: 720px` and `max-width: 880px`, article rail collapses to single column. Verified reflow at 320px and at 200% zoom.

## How to verify

### Quick smoke (every PR)
1. `npm run build && npm run preview`.
2. Tab through `/`, `/essays`, `/essays/why-graphql-now`, `/notes/community-as-infrastructure` — skip link first, focus always visible.
3. Open the menu → focus lands on Close, Tab cycles inside, Esc returns to trigger.
4. Toggle "Reduce motion" → menu slide is suppressed.
5. Zoom to 200% → no horizontal scroll, no clipped controls.

### Tooling
- **Lighthouse**: Chrome DevTools → Lighthouse → Accessibility → `/`, `/essays`, an essay page. Target: 95+.
- **axe**: axe DevTools extension on each core page. Target: 0 critical + 0 serious.
- **VoiceOver smoke** (macOS): Cmd+F5 → VO+U → "Landmarks" shows `banner`, `main`, `contentinfo`. Open the menu → announced as a dialog labelled "Contents".

## Known limitations / non-goals

- No forms on the site currently. If/when a comment or subscribe form is added: `<label for>` on every control, `aria-describedby` for help text, `aria-invalid` + `aria-describedby` on errors, success messages in a polite live region.
