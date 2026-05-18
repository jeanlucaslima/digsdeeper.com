import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL('https://digsdeeper.com')).toString().replace(/\/$/, '');
	const essays = (await getCollection('essays', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.published.getTime() - a.data.published.getTime(),
	);
	const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.published.getTime() - a.data.published.getTime(),
	);
	const series = (await getCollection('series')).sort(
		(a, b) => b.data.started.getTime() - a.data.started.getTime(),
	);

	const lines: string[] = [
		'# digsdeeper',
		'',
		'> A public research archive for durable arguments about software, strategy, AI, systems, and technology culture. Essays, notes, and long-running investigations by Jean Lucas Lima.',
		'',
		'## About',
		`- [About](${base}/about): What digsdeeper is and how it fits alongside Jean's other surfaces.`,
		`- [Jean Lucas Lima](https://jeanlucas.me): Canonical identity and public map.`,
		'',
		'## Active series',
		...series.map((s) => `- [${s.data.title}](${base}/series/${s.id}): ${s.data.central_question}`),
		'',
		'## Featured essays',
		...essays.slice(0, 10).map((e) => `- [${e.data.title}](${base}/essays/${e.id}): ${e.data.thesis}`),
		'',
		'## Recent notes',
		...notes.slice(0, 10).map((n) => `- [${n.data.title}](${base}/notes/${n.id}): ${n.data.claim}`),
		'',
		'## Feeds',
		`- [RSS](${base}/feed.xml)`,
		`- [Sitemap](${base}/sitemap.xml)`,
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
