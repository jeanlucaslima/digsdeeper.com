import type { APIRoute } from 'astro';
import { buildRssResponse } from '../lib/rss';

export const GET: APIRoute = ({ site }) => buildRssResponse(site, '/feed.xml');
