import { describe, it, expect } from 'vitest';
import { ROOM_MODE } from '@pomodoro/shared';
import { formatSessionLabel } from './session-label';

describe('formatSessionLabel', () => {
  it.each([
    { cycle: 0, mode: ROOM_MODE.IDLE, expected: 'idle' },
    { cycle: 1, mode: ROOM_MODE.FOCUS, expected: '1st focus' },
    { cycle: 2, mode: ROOM_MODE.BREAK, expected: '2nd break' },
    { cycle: 3, mode: ROOM_MODE.FOCUS, expected: '3rd focus' },
    { cycle: 4, mode: ROOM_MODE.BREAK, expected: '4th break' },
  ])(
    '대기 중이면 "idle", 진행 중이면 회차와 모드로 "1st focus", "2nd break" 같은 라벨을 만든다 ($cycle, $mode → $expected)',
    ({ cycle, mode, expected }) => {
      // when
      const result = formatSessionLabel(cycle, mode);

      // then
      expect(result).toBe(expected);
    },
  );
});
