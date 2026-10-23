// PostToolUse 훅: Edit/Write로 바뀐 파일 하나에만 Prettier를 실행한다.
// 실패해도 도구 실행을 막지 않도록 항상 exit 0으로 끝낸다.
import { spawnSync } from 'node:child_process';

const PRETTIER_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html)$/;

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch {
    return;
  }
  if (!filePath || !PRETTIER_EXT.test(filePath)) return;

  spawnSync('pnpm', ['exec', 'prettier', '--write', filePath], {
    cwd: process.env.CLAUDE_PROJECT_DIR,
    stdio: 'ignore',
  });
});
