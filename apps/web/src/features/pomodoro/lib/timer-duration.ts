import { TIMER_DURATION_RULE, type TimerDurationKind } from '@pomodoro/shared';

export type StepDirection = 'decrease' | 'increase';

// 한 단위 바꾼 값. 한도를 넘으면 한도에 머문다
export function stepDuration(
  kind: TimerDurationKind,
  minutes: number,
  direction: StepDirection,
): number {
  const { minMinutes, maxMinutes, stepMinutes } = TIMER_DURATION_RULE[kind];
  const nextMinutes =
    direction === 'increase' ? minutes + stepMinutes : minutes - stepMinutes;
  return Math.min(Math.max(nextMinutes, minMinutes), maxMinutes);
}

// 한도에 닿아 더 바꿀 수 없으면 false
export function canStepDuration(
  kind: TimerDurationKind,
  minutes: number,
  direction: StepDirection,
): boolean {
  return stepDuration(kind, minutes, direction) !== minutes;
}
