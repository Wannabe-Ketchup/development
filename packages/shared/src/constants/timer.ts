// 기본값과 설정 규칙을 한곳에 둔다. 기본값만 바꾸다 범위·단위를 벗어나지 않게 하기 위해서다
export const TIMER_DURATION_RULE = {
  focus: {
    defaultMinutes: 25,
    minMinutes: 10,
    maxMinutes: 60,
    stepMinutes: 5,
  },
  break: { defaultMinutes: 5, minMinutes: 1, maxMinutes: 20, stepMinutes: 1 },
} as const;

export type TimerDurationKind = keyof typeof TIMER_DURATION_RULE;

const SECONDS_PER_MINUTE = 60;

export const FOCUS_DURATION_SECONDS =
  TIMER_DURATION_RULE.focus.defaultMinutes * SECONDS_PER_MINUTE;
export const BREAK_DURATION_SECONDS =
  TIMER_DURATION_RULE.break.defaultMinutes * SECONDS_PER_MINUTE;
export const CYCLE_COUNT = 4;
