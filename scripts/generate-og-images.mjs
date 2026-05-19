#!/usr/bin/env node
// Build-time generator for Open Graph / Twitter card images.
// Renders 1200×630 PNGs into public/og/ from essay + note frontmatter.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'og');
const COMPAT_OUT = path.join(ROOT, 'public', 'og-default.png');

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
	bg: '#f7f3ea',
	ink: '#171411',
	muted: '#5f574e',
	accent: '#1f4e5f',
	alert: '#9c3b2e',
	caution: '#d8b758',
	line: '#d6cdbf',
};

const FONT_STACK =
	"'Google Sans', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function escapeXml(s) {
	return String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

// Greedy word-wrap by an estimated character budget per line.
function wrap(text, maxChars, maxLines) {
	const words = String(text ?? '').trim().split(/\s+/);
	const lines = [];
	let cur = '';
	let i = 0;
	for (; i < words.length; i++) {
		const w = words[i];
		const next = cur ? cur + ' ' + w : w;
		if (next.length > maxChars && cur) {
			lines.push(cur);
			cur = w;
			if (lines.length >= maxLines) {
				cur = '';
				break;
			}
		} else {
			cur = next;
		}
	}
	if (cur && lines.length < maxLines) {
		lines.push(cur);
		i = words.length;
	}
	if (i < words.length && lines.length > 0) {
		const last = lines[lines.length - 1].replace(/[.,;:]+$/, '');
		lines[lines.length - 1] = last + '…';
	}
	return lines;
}

function shovelMark(x, y, size) {
	const s = size / 24;
	const tx = (n) => (x + n * s).toFixed(2);
	const ty = (n) => (y + n * s).toFixed(2);
	return `
    <g>
      <path d="M ${tx(12)} ${ty(2.5)} L ${tx(22.5)} ${ty(21)} H ${tx(1.5)} Z"
            fill="${COLORS.caution}" stroke="${COLORS.ink}"
            stroke-width="${(1.8 * s).toFixed(2)}" stroke-linejoin="round" />
      <rect x="${tx(10.5)}" y="${ty(10)}" width="${(3 * s).toFixed(2)}" height="${(1.4 * s).toFixed(2)}" fill="${COLORS.ink}" />
      <rect x="${tx(11.4)}" y="${ty(11.4)}" width="${(1.2 * s).toFixed(2)}" height="${(4 * s).toFixed(2)}" fill="${COLORS.ink}" />
      <polygon points="${tx(8.6)},${ty(15.4)} ${tx(15.4)},${ty(15.4)} ${tx(14.2)},${ty(19)} ${tx(9.8)},${ty(19)}" fill="${COLORS.ink}" />
    </g>`;
}

function buildSvg({ kind, eyebrow, title, deck, byline = 'Jean Lucas Lima', titleMaxLines = 3 }) {
	const titleLines = wrap(title, 24, titleMaxLines);
	const titleFont = titleLines.length >= 4 ? 60 : titleLines.length === 3 ? 72 : titleLines.length === 2 ? 84 : 96;
	const titleLineHeight = Math.round(titleFont * 1.08);
	const titleBlockHeight = titleLines.length * titleLineHeight;
	// Vertical layout: top rule at 80, eyebrow at 130, title block starts ~210, deck below.
	const titleTop = 210;
	const titleBaselineStart = titleTop + Math.round(titleFont * 0.85);

	const deckLines = deck ? wrap(deck, 64, 3) : [];
	const deckFont = 28;
	const deckLineHeight = Math.round(deckFont * 1.4);
	const deckTop = titleTop + titleBlockHeight + 40;

	const titleSvg = titleLines
		.map(
			(line, i) =>
				`<text x="80" y="${titleBaselineStart + i * titleLineHeight}" font-family="${FONT_STACK}" font-size="${titleFont}" font-weight="600" fill="${COLORS.ink}" letter-spacing="-1">${escapeXml(line)}</text>`,
		)
		.join('\n');

	const deckSvg = deckLines
		.map(
			(line, i) =>
				`<text x="80" y="${deckTop + i * deckLineHeight}" font-family="${FONT_STACK}" font-size="${deckFont}" font-weight="400" fill="${COLORS.muted}">${escapeXml(line)}</text>`,
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}" />
  <!-- Top accent rule -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="${COLORS.accent}" />
  <!-- Eyebrow / kicker -->
  <text x="80" y="138" font-family="${FONT_STACK}" font-size="22" font-weight="500"
        letter-spacing="3" fill="${COLORS.alert}">${escapeXml((eyebrow || kind || '').toUpperCase())}</text>

  <!-- Title -->
  ${titleSvg}

  <!-- Deck -->
  ${deckSvg}

  <!-- Footer left: brand -->
  ${shovelMark(80, HEIGHT - 80, 36)}
  <text x="132" y="${HEIGHT - 52}" font-family="${FONT_STACK}" font-size="26" font-weight="600" fill="${COLORS.ink}">digsdeeper</text>
  <text x="132" y="${HEIGHT - 28}" font-family="${FONT_STACK}" font-size="18" font-weight="400" fill="${COLORS.muted}">${escapeXml(byline)}</text>

  <!-- Footer right: domain -->
  <text x="${WIDTH - 80}" y="${HEIGHT - 36}" text-anchor="end" font-family="${FONT_STACK}" font-size="20" font-weight="500" letter-spacing="1" fill="${COLORS.muted}">digsdeeper.com</text>
</svg>`;
}

async function renderToPng(svg, outPath) {
	const buf = Buffer.from(svg, 'utf8');
	await sharp(buf, { density: 144 })
		.resize(WIDTH, HEIGHT, { fit: 'cover' })
		.png({ compressionLevel: 9 })
		.toFile(outPath);
}

function parseFrontmatter(raw) {
	const m = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	return yaml.load(m[1]);
}

async function readCollection(dir, kind) {
	const full = path.join(ROOT, 'src', 'content', dir);
	let entries = [];
	try {
		entries = await fs.readdir(full);
	} catch {
		return [];
	}
	const out = [];
	for (const file of entries) {
		if (!file.endsWith('.md')) continue;
		const raw = await fs.readFile(path.join(full, file), 'utf8');
		const data = parseFrontmatter(raw);
		if (!data || data.draft) continue;
		out.push({
			slug: file.replace(/\.md$/, ''),
			kind,
			title: data.title,
			deck: data.summary ?? data.thesis ?? data.claim ?? data.central_question ?? '',
		});
	}
	return out;
}

async function main() {
	await fs.mkdir(OUT_DIR, { recursive: true });

	const essays = await readCollection('essays', 'Essay');
	const notes = await readCollection('notes', 'Note');

	const jobs = [
		{
			file: path.join(OUT_DIR, 'default.png'),
			label: 'default',
			svg: buildSvg({
				eyebrow: 'Serious essays',
				title: 'DigsDeeper',
				deck: 'Serious essays about software, strategy, AI, systems, and technology culture.',
			}),
		},
		{
			file: path.join(OUT_DIR, 'home.png'),
			label: 'home',
			svg: buildSvg({
				eyebrow: 'DigsDeeper',
				title: 'Serious essays about software, strategy, AI, and systems.',
				deck: 'Long-form arguments, working notes, and investigations by Jean Lucas Lima.',
			}),
		},
		...essays.map((e) => ({
			file: path.join(OUT_DIR, `${e.slug}.png`),
			label: `essays/${e.slug}`,
			svg: buildSvg({ eyebrow: 'Essay', title: e.title, deck: e.deck }),
		})),
		...notes.map((n) => ({
			file: path.join(OUT_DIR, `${n.slug}.png`),
			label: `notes/${n.slug}`,
			svg: buildSvg({ eyebrow: 'Note', title: n.title, deck: n.deck }),
		})),
	];

	let defaultOk = false;
	for (const job of jobs) {
		try {
			await renderToPng(job.svg, job.file);
			if (job.label === 'default') defaultOk = true;
			console.log(`  og: wrote ${path.relative(ROOT, job.file)}`);
		} catch (err) {
			console.error(`  og: failed to render ${job.label}:`, err.message);
			if (job.label === 'default' || job.label === 'home') throw err;
		}
	}

	if (!defaultOk) {
		throw new Error('default OG image was not generated');
	}

	// Compatibility fallback at /og-default.png — copy of /og/default.png.
	await fs.copyFile(path.join(OUT_DIR, 'default.png'), COMPAT_OUT);
	console.log(`  og: wrote ${path.relative(ROOT, COMPAT_OUT)}`);
}

main().catch((err) => {
	console.error('OG image generation failed:', err);
	process.exit(1);
});
