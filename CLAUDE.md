# CLAUDE.md

pnpm + Turborepo 모노레포. Node 24 (`.nvmrc`).

## 구조

| 경로              | 내용                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `apps/api`        | `@pomodoro/api`: NestJS 11 API 서버 (:3000)                          |
| `apps/web`        | `@pomodoro/web`: React 19 + Vite (:5173). `/api` 요청은 api로 프록시 |
| `packages/shared` | `@pomodoro/shared`: api와 web이 함께 쓰는 요청·응답 타입과 상수      |

## 명령

- `pnpm dev`: turbo가 shared를 빌드한 뒤 api·web을 동시에 실행
- `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm format` / `pnpm format:check`
- 패키지 하나만: `pnpm --filter @pomodoro/api test`, `pnpm --filter @pomodoro/web test`
- 별도 `typecheck` 스크립트는 없다. 타입 검증은 `pnpm build`(api: `nest build`, web: `tsc -b && vite build`)로 한다.
- `packages/shared`를 바꾼 뒤에는 `pnpm --filter @pomodoro/shared build`를 실행해야 web에 반영된다. (api의 Jest는 shared `src`를 직접 매핑한다.)
- 주의: api의 `lint` 스크립트는 `eslint --fix`라 파일을 고친다.

## 테스트 위치

- api: `apps/api/test/`가 `src/` 경로를 그대로 따른다. `src/pomodoro/domain/room.entity.ts` → `test/pomodoro/domain/room.entity.spec.ts`. 통합 테스트는 같은 폴더의 `*.integration.spec.ts`. 모두 `pnpm --filter @pomodoro/api test`로 실행된다.
- web: 대상 파일 옆에 `*.test.ts(x)`(Vitest + Testing Library).

## 도메인 지식

비즈니스 규칙은 `docs/domain/<도메인>.md`에 있다. 해당 도메인을 설계하거나 구현하기 전에 먼저 읽는다.

- `docs/domain/README.md`: 도메인 문서 목록과 작성 원칙(확정 / 논의 필요 / 현재 구현과 다름)
- `docs/domain/pomodoro.md`: 방 입장·퇴장·연결 유예, 타이머(집중·휴식 반복, 조작, 알림), 참여자(닉네임·상태 메시지·입력 문자), 범위
- `docs/domain/auth.md`: 게스트 자동 로그인, 참여자 ID, 로그인 세션, 구글 로그인(추후)

도메인 규칙을 추가하거나 바꾸면 같은 작업에서 해당 문서도 고친다. 새 도메인이면 문서를 새로 만들고 위 목록에 추가한다.
컨벤션 문서(`.claude/rules/`)에는 도메인 지식을 적지 않는다.

## 개발 하네스

기능 개발은 `/develop <요구사항 | 파일 경로>`로 진행한다.
흐름은 분석 → 질문 → 설계 문서 승인 → 구현 → P0~P2 보고이며, 상세 절차는 `.claude/skills/develop/SKILL.md`에 있다.

- 서브에이전트: `.claude/agents/`
- 설계 문서와 구현 결과: `.harness/`

## 컨벤션

해당 경로를 작업할 때 아래 규칙이 자동으로 적용된다. 여기에 내용을 옮겨 적지 않는다.

- `apps/api/**`: `.claude/rules/backend-conventions.md`(설계·구현), `.claude/rules/backend-testing.md`(테스트)
- `apps/web/**`: `.claude/rules/frontend-conventions.md`
- 커밋 메시지: `.github/commit_convention.md`, PR: `.github/pull_request_template.md`

공통 원칙

- api와 web이 공유하는 타입은 `@pomodoro/shared`에만 정의한다.
- 실제 개인정보나 비밀값은 코드·테스트·문서에 넣지 않고 더미 값을 쓴다.
- 규칙은 **새로 작성하거나 수정하는 코드**에 적용한다. 규칙에 맞지 않는 기존 코드를 작업 범위 밖에서 고치지 않는다(필요하면 후속 작업으로 제안한다).
- `.harness/`와 `.claude/settings.local.json`은 gitignore된 로컬 전용 파일이다. 커밋에 넣지 않는다.
