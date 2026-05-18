// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://digsdeeper.com',
	trailingSlash: 'never',
	build: { format: 'directory' },
});
