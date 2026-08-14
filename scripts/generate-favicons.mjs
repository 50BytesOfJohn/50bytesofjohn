import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(projectRoot, 'public');
const iconsDir = resolve(publicDir, 'icons');
const fontPath = resolve(projectRoot, 'src/assets/fonts/geist-pixel-regular.woff2');

const SIZE = 1024;
const INK = '#000000';
const BACKGROUND = '#ffffff';
const MARK = '50';

function buildMark(font, maxWidth) {
	const glyphs = font.glyphsForString(MARK);
	let cursor = 0;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const paths = [];

	for (const glyph of glyphs) {
		minX = Math.min(minX, cursor + glyph.bbox.minX);
		minY = Math.min(minY, glyph.bbox.minY);
		maxX = Math.max(maxX, cursor + glyph.bbox.maxX);
		maxY = Math.max(maxY, glyph.bbox.maxY);
		paths.push(`<path d="${glyph.path.toSVG()}" transform="translate(${cursor} 0)"/>`);
		cursor += glyph.advanceWidth;
	}

	const inkWidth = maxX - minX;
	const inkHeight = maxY - minY;
	const scale = Math.min(maxWidth / inkWidth, 0.62 * SIZE / inkHeight);
	const left = (SIZE - inkWidth * scale) / 2;
	const top = (SIZE - inkHeight * scale) / 2;
	const translateX = left - minX * scale;
	const translateY = top + maxY * scale;

	return `<g fill="${INK}" transform="translate(${translateX} ${translateY}) scale(${scale} ${-scale})">${paths.join('')}</g>`;
}

function buildSvg(font, maxWidth) {
	return [
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">',
		'<title>50BytesOfJohn</title>',
		`<rect width="1024" height="1024" fill="${BACKGROUND}"/>`,
		buildMark(font, maxWidth),
		'</svg>',
		'',
	].join('');
}

async function renderPng(svg, size) {
	return sharp(Buffer.from(svg))
		.resize(size, size, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
		.png({ compressionLevel: 9, palette: true, quality: 100 })
		.toBuffer();
}

const font = create(await readFile(fontPath));
if (font.isCollection) throw new Error(`Expected a single font in ${fontPath}`);

await mkdir(iconsDir, { recursive: true });

const regularSvg = buildSvg(font, 0.76 * SIZE);
const maskableSvg = buildSvg(font, 0.6 * SIZE);
await writeFile(resolve(publicDir, 'favicon.svg'), regularSvg);

const sizes = [16, 32, 48, 180, 192, 512];
const pngs = new Map(
	await Promise.all(sizes.map(async (size) => [size, await renderPng(regularSvg, size)])),
);

await Promise.all([
	writeFile(resolve(iconsDir, 'favicon-16x16.png'), pngs.get(16)),
	writeFile(resolve(iconsDir, 'favicon-32x32.png'), pngs.get(32)),
	writeFile(resolve(publicDir, 'apple-touch-icon.png'), pngs.get(180)),
	writeFile(resolve(iconsDir, 'icon-192.png'), pngs.get(192)),
	writeFile(resolve(iconsDir, 'icon-512.png'), pngs.get(512)),
	writeFile(resolve(iconsDir, 'icon-maskable-512.png'), await renderPng(maskableSvg, 512)),
	writeFile(
		resolve(publicDir, 'favicon.ico'),
		await pngToIco([pngs.get(16), pngs.get(32), pngs.get(48)]),
	),
]);

console.log('Generated favicon.svg, favicon.ico, Apple touch icon, and web app icons.');
