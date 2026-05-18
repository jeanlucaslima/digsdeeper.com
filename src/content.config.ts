import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const essayStatus = z.enum(['Draft', 'Working argument', 'Published', 'Revised', 'Canonical', 'Archived']);
const noteStatus = z.enum(['Draft', 'Working note', 'Published', 'Revised', 'Archived']);
const seriesStatus = z.enum(['Active', 'Dormant', 'Closed']);

const essays = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
	schema: z.object({
		title: z.string(),
		thesis: z.string(),
		summary: z.string().optional(),
		status: essayStatus.default('Published'),
		topics: z.array(z.string()).default([]),
		field: z.string().optional(),
		series: z.string().optional(),
		published: z.coerce.date(),
		updated: z.coerce.date().optional(),
		reading_time: z.string().optional(),
		canonical: z.string().url().optional(),
		related: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

const notes = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
	schema: z.object({
		title: z.string(),
		claim: z.string(),
		summary: z.string().optional(),
		status: noteStatus.default('Working note'),
		topics: z.array(z.string()).default([]),
		field: z.string().optional(),
		related: z.array(z.string()).default([]),
		published: z.coerce.date(),
		updated: z.coerce.date().optional(),
		draft: z.boolean().default(false),
	}),
});

const series = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
	schema: z.object({
		title: z.string(),
		central_question: z.string(),
		description: z.string().optional(),
		status: seriesStatus.default('Active'),
		started: z.coerce.date(),
		updated: z.coerce.date().optional(),
		reading_path: z.array(z.string()).default([]),
	}),
});

export const collections = { essays, notes, series };
