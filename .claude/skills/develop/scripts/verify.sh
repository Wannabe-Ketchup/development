#!/usr/bin/env bash
# /develop 검증 스크립트. 전체 로그는 .harness/logs/에 남기고, 화면에는 단계별 결과와 실패 부분만 출력한다.
#
# 사용법:
#   verify.sh                  전체 검증 (shared build → build → test → lint → format:check)
#   verify.sh --pkg <name>     한 패키지의 build·test만 (예: --pkg @pomodoro/api). lint를 돌리지 않아 파일을 고치지 않는다.

set -u

cd "$(git rev-parse --show-toplevel)" || exit 1

pkg=""
if [ "${1:-}" = "--pkg" ]; then
  pkg="${2:?--pkg 다음에 패키지 이름이 필요하다}"
fi

log_dir=".harness/logs"
mkdir -p "$log_dir"
ts="$(date +%Y%m%d-%H%M%S)"
failed=0

# run <단계 이름> <명령...>: 성공이면 한 줄, 실패면 에러 라인과 마지막 30줄을 출력한다.
run() {
  local name="$1"
  shift
  local log="$log_dir/$ts-$name.log"
  if "$@" >"$log" 2>&1; then
    echo "PASS $name"
  else
    failed=1
    echo "FAIL $name (전체 로그: $log)"
    echo "--- 에러 라인 (최대 40줄)"
    grep -nE 'error|Error|ERR!|FAIL|✕|×|●' "$log" | head -40
    echo "--- 마지막 30줄"
    tail -30 "$log"
    echo "---"
  fi
}

# has_script <패키지 디렉터리> <스크립트>: package.json에 해당 스크립트가 있는지 확인한다.
has_script() {
  node -e "process.exit(require('./$1/package.json').scripts?.['$2'] ? 0 : 1)"
}

if [ -n "$pkg" ]; then
  case "$pkg" in
    @pomodoro/api) dir="apps/api" ;;
    @pomodoro/web) dir="apps/web" ;;
    @pomodoro/shared) dir="packages/shared" ;;
    *) echo "알 수 없는 패키지: $pkg" >&2; exit 2 ;;
  esac
  short="${pkg#@pomodoro/}"
  # web은 shared의 빌드 산출물을 쓰므로 shared를 먼저 빌드한다.
  [ "$short" != "shared" ] && run shared-build pnpm --filter @pomodoro/shared build
  run "$short-build" pnpm --filter "$pkg" build
  if has_script "$dir" test; then
    run "$short-test" pnpm --filter "$pkg" test
  fi
  exit "$failed"
fi

run shared-build pnpm --filter @pomodoro/shared build
run build pnpm build
run test pnpm test

# snapshot: 수정·신규 파일의 "해시 경로" 목록. lint 전후를 비교해 --fix로 바뀐 파일을 찾는다.
snapshot() {
  git ls-files -m -o --exclude-standard | while read -r f; do
    [ -f "$f" ] && echo "$(git hash-object "$f") $f"
  done | sort
}

# api의 lint는 eslint --fix라 파일을 고친다. 고쳐진 파일을 알려준다.
before="$(snapshot)"
run lint pnpm lint
changed="$(comm -13 <(printf '%s\n' "$before") <(snapshot) | cut -d' ' -f2-)"
if [ -n "$changed" ]; then
  echo "lint --fix로 바뀐 파일:"
  printf '%s\n' "$changed" | sed 's/^/  /'
fi

run format-check pnpm format:check

exit "$failed"
