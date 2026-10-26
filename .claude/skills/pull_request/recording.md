# 화면 녹화 (화면이 바뀐 PR)

Playwright 가 녹화한 `.webm` 을 변환 없이 그대로 올린다(GitHub 본문에서 영상으로 재생된다). 저장소 파일은 고치지 않고, 녹화 도구는 scratchpad 에 따로 둔다(저장소의 Playwright 유무와 무관).

1. **장면**: 정상 흐름 + 눈에 띄는 검증(오류 표시, 버튼 비활성화). 화면이 그대로인 장면(새로고침 유지 등)은 개요에 글로 쓴다.
2. **앱 실행**: 3000·5173 이 비었는지 본다(`lsof -i :3000 -i :5173`). 쓰고 있으면 끄지 말고 묻는다.
   - head 가 지금 브랜치이고 작업 트리가 깨끗하면 저장소에서 바로 `pnpm dev` 를 백그라운드로 띄운다.
   - 아니면 `git worktree add --detach <scratchpad>/pr-rec <head>` → `pnpm install --frozen-lockfile` → `apps/api/.env` 를 `cp` 로만 복사(내용은 읽지 않는다) → `pnpm dev`.
   - PID 를 적어 두고 `http://localhost:5173` 응답을 기다린다.
3. **녹화**: `<scratchpad>/pr-recorder/` 에 `pnpm add -D @playwright/test`(`apps/web` 에 있으면 같은 버전) → `pnpm exec playwright install chromium`.
   - config: `baseURL: http://localhost:5173`, viewport 와 `video.size` 를 둘 다 1440×900(다르면 회색 띠. 1280×800 은 뽀모도로 화면 위쪽이 잘린다), `video: "on"`, `workers: 1`, `webServer` 없음.
   - 시나리오: 입력은 `pressSequentially(text, { delay: 90 })`, 장면 사이 1~1.5초 멈춤, 선택자는 `getByRole`·`getByLabel`. 실제 서버로 녹화한다(API mock 금지).
   - 장면마다 `page.screenshot({ path: "shots/NN-<장면>.png" })` 를 남긴다(확인용).
   - 영상 하나는 한 페이지 안에서 끝낸다(새 탭·컨텍스트는 영상이 따로 생긴다). 다른 참여자는 영상 없는 컨텍스트로 만든다.
4. **확인**: `shots/*.png` 를 열어 장면 순서·잘림을 본다. 요소가 겹치거나 잘리는 등 정상 화면이 아니면 그 영상은 쓰지 않는다. 해상도 탓이면 viewport 를 키워, 코드 탓이면 고친 뒤 다시 녹화한다. `record-results/**/video.webm` 을 `<이름>.webm` 으로 옮긴다. 10MB(GitHub 업로드 제한)를 넘으면 장면을 나눠 다시 녹화한다.
5. **정리**: 띄운 `pnpm dev` 만 자식 프로세스까지 끄고 포트가 비었는지 본다. worktree 를 만들었으면 `git worktree remove --force`.

## 올리기

`gh` 로는 파일을 업로드할 수 없다.

1. 스크린샷 절에 `<!-- 영상: <이름> -->` 를 두고 PR 을 만든다.
2. `https://github.com/user-attachments/assets/...` 주소를 받는다. 댓글은 등록하지 않는다.
   - Claude in Chrome(`mcp__claude-in-chrome__*`)이 있으면: PR 댓글창에 `.webm` 을 올려 생긴 주소를 읽는다.
   - 없으면: `.webm` 을 바탕화면에 복사한다(macOS `~/Desktop`, Windows `%USERPROFILE%\Desktop`. `uname`/OS 로 먼저 확인한다). 그 전체 경로를 알리고, 개발자가 PR 댓글창에 끌어다 놓아 생긴 주소를 달라고 한다.
3. 자리 표시만 그 주소로 바꿔 `gh pr edit <번호> --body-file` 한다. 이 교체는 승인 범위에 포함되고, 다른 수정은 다시 묻는다.
