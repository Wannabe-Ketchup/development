import { formatChatTime } from './chat-time';

describe('formatChatTime', () => {
  // 테스트를 돌리는 곳의 시간대와 상관없게 현지 시각으로 만든다
  it.each([
    { hours: 14, minutes: 2, expected: '14:02' },
    { hours: 0, minutes: 0, expected: '00:00' },
    { hours: 9, minutes: 59, expected: '09:59' },
  ])(
    '현지 시각 $hours시 $minutes분이면 $expected를 돌려준다',
    ({ hours, minutes, expected }) => {
      // given
      const sentAt = new Date(2026, 0, 1, hours, minutes, 30).toISOString();

      // when
      const time = formatChatTime(sentAt);

      // then
      expect(time).toBe(expected);
    },
  );
});
