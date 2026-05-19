# Google Search Console — digsdeeper.com

## Canonical host

- Canonical: `https://digsdeeper.com` (apex, HTTPS, no trailing slash — `trailingSlash: 'never'` in `astro.config.mjs`).
- Redirect `www.digsdeeper.com` and any `http://` variants to the canonical host with a 301 at the host/CDN layer.

## What's already in the repo

- `public/robots.txt` — allows all crawlers and points at `/sitemap.xml`.
- `src/pages/sitemap.xml.ts` — generates the sitemap from `essays`, `notes`, and `series` collections (drafts excluded), plus `/`, `/essays`, `/notes`, `/series`, `/about`, `/feed.xml`.
- Per-page `<title>`, `<meta name="description">`, canonical, OpenGraph, and Twitter tags via `src/layouts/Layout.astro`.
- JSON-LD:
  - `/` — `WebSite` + `Person` (`src/pages/index.astro`).
  - Essays and notes — `Article` (`src/layouts/ArticleLayout.astro`, includes `headline`, `datePublished`, `dateModified`, `author`, `publisher`, optional `abstract` from `thesis`/`claim`, `keywords` from `topics`).

## Verifying the domain in Search Console

1. Go to <https://search.google.com/search-console> → **Add property** → **Domain** → enter `digsdeeper.com`.
2. Add the `TXT` record Google provides at the DNS root (`@`) at the registrar / Cloudflare DNS.
3. Click **Verify**. The Domain property covers `digsdeeper.com` and every subdomain over HTTP and HTTPS.

## Submitting the sitemap

1. Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**.
2. Confirm status **Success** and that the URL count matches `dist/sitemap.xml` after the latest build.

## Requesting indexing for priority URLs

- `/`
- `/essays`
- Every published essay under `/essays/<slug>`

Per URL: **URL Inspection** → **Test live URL** → confirm "URL is available to Google" with no canonical conflict → **Request indexing**.

## Smoke checks after each deploy

```sh
curl -sI https://digsdeeper.com/robots.txt | head -1     # → HTTP/2 200
curl -s   https://digsdeeper.com/sitemap.xml | head -3   # → valid XML
curl -sI https://digsdeeper.com/                         # → 200, not redirected
curl -sI https://www.digsdeeper.com/                     # → 301 → apex
```
