import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const TARGET_EXTENSIONS = ['.js', '.css'];

function collectFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    if (statSync(fullPath).isDirectory()) return collectFiles(fullPath);
    return TARGET_EXTENSIONS.some((ext) => fullPath.endsWith(ext))
      ? [fullPath]
      : [];
  });
}

for (const filePath of collectFiles(DIST_DIR)) {
  const compressed = gzipSync(readFileSync(filePath), { level: 9 });
  writeFileSync(`${filePath}.gz`, compressed);
}
