// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// TODO: set to the real domain — used for canonical URLs, sitemap and RSS.
	site: 'https://50bytesofjohn.dev',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			// Every token in this theme clears 4.5:1 on the code surface; the softer light themes
			// (vitesse-light, min-light) put punctuation and identifiers under 3:1.
			theme: 'github-light-high-contrast',
			transformers: [
				{
					// Shiki writes the block's background and base colour as an inline style, which
					// no stylesheet can override. Dropping it lets the page own the code surface.
					pre(node) {
						delete node.properties.style;
					},
				},
			],
		},
	},
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
			provider: fontProviders.local(),
			name: 'Geist Pixel',
			cssVariable: '--font-geist-pixel',
			fallbacks: ['ui-monospace', 'monospace'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/geist-pixel-regular.woff2'],
						weight: 400,
						style: 'normal',
					},
				],
			},
		},
	],
});
