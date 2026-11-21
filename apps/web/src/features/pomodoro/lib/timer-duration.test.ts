import { describe, it, expect } from 'vitest';
import type { TimerDurationKind } from '@pomodoro/shared';
import {
  canStepDuration,
  stepDuration,
  type StepDirection,
} from './timer-duration';

describe('stepDuration', () => {
  it.each<{
    kind: TimerDurationKind;
    minutes: number;
    direction: StepDirection;
    expected: number;
    canStep: boolean;
  }>([
    {
      kind: 'focus',
      minutes: 25,
      direction: 'increase',
      expected: 30,
      canStep: true,
    },
    {
      kind: 'focus',
      minutes: 25,
      direction: 'decrease',
      expected: 20,
      canStep: true,
    },
    {
      kind: 'focus',
      minutes: 60,
      direction: 'increase',
      expected: 60,
      canStep: false,
    },
    {
      kind: 'focus',
      minutes: 10,
      direction: 'decrease',
      expected: 10,
      canStep: false,
    },
    {
      kind: 'break',
      minutes: 5,
      direction: 'increase',
      expected: 6,
      canStep: true,
    },
    {
      kind: 'break',
      minutes: 5,
      direction: 'decrease',
      expected: 4,
      canStep: true,
    },
    {
      kind: 'break',
      minutes: 20,
      direction: 'increase',
      expected: 20,
      canStep: false,
    },
    {
      kind: 'break',
      minutes: 1,
      direction: 'decrease',
      expected: 1,
      canStep: false,
    },
  ])(
    '집중은 5분, 휴식은 1분씩 바뀌고 한도를 넘지 않는다 ($kind $minutes분 $direction)',
    ({ kind, minutes, direction, expected, canStep }) => {
      // given: 파라미터

      // when
      const result = stepDuration(kind, minutes, direction);

      // then
      expect(result).toBe(expected);
      expect(canStepDuration(kind, minutes, direction)).toBe(canStep);
    },
  );
});
