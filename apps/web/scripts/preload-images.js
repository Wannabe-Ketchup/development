import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WALL_SIZES, FLOOR_SIZES } from '../src/features/pomodoro/image-sizes.js';

const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const ASSETS_DIR = join(DIST_DIR, 'assets');
const INDEX_HTML = join(DIST_DIR, 'index.html');

function buildImageSrcSet(prefix) {
  const pattern = new RegExp(`^${prefix}-(\\d+)-[^.]+\\.webp$`);
  return readdirSync(ASSETS_DIR)
    .flatMap((name) => {
      const match = name.match(pattern);
      return match ? [{ width: Number(match[1]), name }] : [];
    })
    .sort((a, b) => a.width - b.width)
    .map(({ width, name }) => `/assets/${name} ${width}w`)
    .join(', ');
}

function buildPreloadTag(prefix, sizes) {
  const imagesrcset = buildImageSrcSet(prefix);
  return `    <link rel="preload" as="image" imagesrcset="${imagesrcset}" imagesizes="${sizes}">`;
}

const preloadTags = [
  buildPreloadTag('wall', WALL_SIZES),
  buildPreloadTag('floor', FLOOR_SIZES),
].join('\n');

const html = readFileSync(INDEX_HTML, 'utf-8');
writeFileSync(INDEX_HTML, html.replace('</head>', `${preloadTags}\n  </head>`));
