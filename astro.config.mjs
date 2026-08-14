// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// TODO: set to the real domain — used for canonical URLs, sitemap and RSS.
	site: 'https://50bytesofjohn.dev',
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Geist',
			cssVariable: '--font-geist',
			weights: ['400 600'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
		},
		{
			// ponytail: Geist Pixel ships a single 400 weight on Google Fonts, so no
			// weight list here and no synthetic bold on the wordmark.
			provider: fontProviders.google(),
			name: 'Geist Pixel',
			cssVariable: '--font-geist-pixel',
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
