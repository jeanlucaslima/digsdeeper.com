import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL('https://digsdeeper.com')).toString().replace(/\/$/, '');
	const essays = await getCollection('essays', ({ data }) => !data.draft);
	const notes = await getCollection('notes', ({ data }) => !data.draft);
	const series = await getCollection('series');

	const urls: { loc: string; lastmod?: Date }[] = [
		{ loc: `${base}/` },
		{ loc: `${base}/essays` },
		{ loc: `${base}/notes` },
		{ loc: `${base}/series` },
		{ loc: `${base}/about` },
		{ loc: `${base}/feed.xml` },
		...essays.map((e) => ({ loc: `${base}/essays/${e.id}`, lastmod: e.data.updated ?? e.data.published })),
		...notes.map((n) => ({ loc: `${base}/notes/${n.id}`, lastmod: n.data.updated ?? n.data.published })),
		...series.map((s) => ({ loc: `${base}/series/${s.id}`, lastmod: s.data.updated ?? s.data.started })),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}</url>`,
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
