// dist-ssr/prerender.js를 불러 설명 글을 HTML로 만들고 dist/index.html에 주입한 뒤 dist-ssr를 지운다.
// 예외는 잡지 않는다. 노드가 0이 아닌 코드로 끝나 && 체인의 빌드가 실패한다
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { injectPrerender } from './inject-prerender.js';

const ROOT_DIR = join(import.meta.dirname, '..');
const INDEX_HTML = join(ROOT_DIR, 'dist', 'index.html');
const SSR_DIR = join(ROOT_DIR, 'dist-ssr');

const { renderIntroBookHtml } = await import(
  pathToFileURL(join(SSR_DIR, 'prerender.js')).href
);

const html = readFileSync(INDEX_HTML, 'utf-8');
writeFileSync(INDEX_HTML, injectPrerender(html, renderIntroBookHtml()));
rmSync(SSR_DIR, { recursive: true, force: true });
