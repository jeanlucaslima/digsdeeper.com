import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL('https://digsdeeper.com')).toString().replace(/\/$/, '');
	const essays = await getCollection('essays', ({ data }) => !data.draft);
	const notes = await getCollection('notes', ({ data }) => !data.draft);

	type Item = {
		title: string;
		link: string;
		description: string;
		pubDate: Date;
		category: string;
	};

	const items: Item[] = [
		...essays.map((e) => ({
			title: e.data.title,
			link: `${base}/essays/${e.id}`,
			description: e.data.summary ?? e.data.thesis,
			pubDate: e.data.updated ?? e.data.published,
			category: 'Essay',
		})),
		...notes.map((n) => ({
			title: n.data.title,
			link: `${base}/notes/${n.id}`,
			description: n.data.summary ?? n.data.claim,
			pubDate: n.data.updated ?? n.data.published,
			category: 'Note',
		})),
	].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>digsdeeper</title>
<link>${base}</link>
<description>A public research archive for durable arguments about software, strategy, AI, systems, and technology culture. Essays, notes, and long-running investigations by Jean Lucas Lima.</description>
<language>en</language>
<atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items
	.map(
		(it) => `<item>
<title>${escapeXml(it.title)}</title>
<link>${it.link}</link>
<guid isPermaLink="true">${it.link}</guid>
<pubDate>${it.pubDate.toUTCString()}</pubDate>
<category>${it.category}</category>
<description>${escapeXml(it.description)}</description>
</item>`,
	)
	.join('\n')}
</channel>
</rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
