---
name: pr
description: 지금 브랜치(또는 지정한 브랜치)의 GitHub PR 을 올리는 절차. PR 제목·본문(템플릿 적용)·라벨·base·push 계획을 먼저 보여 주고, 개발자가 승인한 뒤에만 push 하고 PR 을 만든다. "PR 올려줘", "피알 만들자", "/pr" 일 때 쓴다.
argument-hint: '[브랜치 이름 (선택, 없으면 지금 브랜치)]'
---

# /pr

대상: $ARGUMENTS (비어 있으면 지금 브랜치). 승인 전에는 push·PR 생성을 하지 않는다.

## 0. 저장소

- 내 포크 `origin` 에 push 하고, `gh` 기본 저장소 `Wannabe-Ketchup/development`(upstream)의 `staging` 으로 PR 을 연다. 개발자가 말하지 않으면 다른 base·저장소로 올리지 않는다.
- 시작할 때 `gh repo set-default --view` 가 다르면 멈추고 알린다. `git fetch upstream staging` 으로 최신화한다.
- 같은 head 의 열린 PR 이 있으면(`gh pr list --head <브랜치>`) 새로 만들지 않고 본문 갱신을 묻는다.

## 1. 파악한다

1. 변경 범위: `git log upstream/staging..<head>`, `git diff upstream/staging...<head> --stat`. 커밋 안 된 tracked 변경이 있으면 PR 에 빠진다고 알리고 계속할지 묻는다(커밋은 만들지 않는다).
2. 검증: 이 세션에서 안 했으면 `pnpm lint` → `pnpm build` → `pnpm test`. api lint 는 `--fix` 라 바뀐 파일이 생기면 알린다. 실패하면 멈추고 개발자가 정한다.
3. 도메인 규칙: 이 브랜치의 `.harness/` 설계 문서가 있으면 `도메인 지식 변경` 표를 정책 표로 옮긴다. 없으면 관련 `docs/domain/*.md` 를 읽고 세션 작업·커밋으로 참고·신규·수정을 판단하고, 모르겠으면 묻는다(`docs/domain/` 은 gitignore 라 diff 에 안 나온다).
4. 이슈 번호(`#41`)·JIRA 키(`POMO-XXX`)를 브랜치·커밋에서 찾고, 없으면 묻는다.

## 2. PR 내용을 만든다

`.github/pull_request_template.md` 의 안내를 따라 채우고, 안내 주석과 빈 예시 줄은 지운다. 템플릿 외 규칙:

- 제목의 작업 요약은 JIRA·이슈 이름을 쓴다. `feat:` 같은 접두사는 붙이지 않는다.
- 정책 출처에 링크는 걸지 않는다(`docs/domain/` 은 저장소에 없다).
- 화면(`apps/web`)이 바뀌었으면 `recording.md` 를 읽고 화면을 녹화한다.
- 라벨: `feat`·`fix`·`refactor`·`chore`·`docs` 중 내용에 맞게 고른다(복수 가능). 리뷰어·assignee 없음, draft 아님.
- 생성 도구 표기("Generated with Claude Code" 등)는 넣지 않는다.
- 본문은 scratchpad 파일로 쓰고 `--body-file` 로 넘긴다. 비밀값·개인정보는 넣지 않는다.

## 3. 승인받는다

아래 형식만 보여 준다(덧붙이는 말 없이, 본문은 전문). 같은 내용을 AskUserQuestion 선택지 `preview` 에도 넣는다. 선택지: **승인** / **수정할 곳 있음** / **취소**.

```
head → base: <포크 소유자>:<브랜치> → Wannabe-Ketchup/development:staging
push: 커밋 N개
  - <해시> <제목>
라벨: feat
검증: lint ✅ / build ✅ / test ✅ (api N개, web N개)

제목: <PR 제목>

<PR 본문 전문>
```

- 승인은 보여 준 내용에만 유효하다. 무엇이든 바뀌면 다시 묻는다. force push 는 따로 묻는다.

## 4. 올린다

```bash
git push -u origin <브랜치>
gh pr create --base staging --head <포크 소유자>:<브랜치> \
  --title "<제목>" --body-file <본문 파일> --label <라벨>
```

push 가 거절되면 멈추고 알린다. 녹화 영상이 있으면 `recording.md` 의 "올리기"를 따른다.

## 5. 보고한다

PR 주소, head → base, 라벨, push 한 커밋. 영상 주소를 아직 못 받았으면 남은 일로 적는다.
