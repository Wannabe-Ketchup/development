import {
  TIMER_DURATION_RULE,
  type TimerDurationKind,
} from '../constants/timer.js';

// 정수 분이고, 범위 안이고, 최솟값부터 단위만큼 떨어진 값인지. 숫자가 아닌 입력(문자열, undefined)도 false
export function isValidDurationMinutes(
  kind: TimerDurationKind,
  minutes: unknown,
): boolean {
  const { minMinutes, maxMinutes, stepMinutes } = TIMER_DURATION_RULE[kind];
  return (
    typeof minutes === 'number' &&
    Number.isInteger(minutes) &&
    minMinutes <= minutes &&
    minutes <= maxMinutes &&
    (minutes - minMinutes) % stepMinutes === 0
  );
}
