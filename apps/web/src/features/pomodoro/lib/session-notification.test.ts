import { ROOM_MODE } from '@pomodoro/shared';
import { buildSessionNotification } from './session-notification';

describe('buildSessionNotification', () => {
  it.each([
    {
      name: '집중이 시작되면 N회차 집중 시작',
      session: { mode: ROOM_MODE.FOCUS, currentCycle: 2 },
      expected: '2회차 집중 시작',
    },
    {
      name: '휴식이 시작되면 N회차 휴식 시작',
      session: { mode: ROOM_MODE.BREAK, currentCycle: 3 },
      expected: '3회차 휴식 시작',
    },
  ])('$name을 돌려준다', ({ session, expected }) => {
    // given
    const roomId = 'room-1';

    // when
    const { title } = buildSessionNotification(roomId, session);

    // then
    expect(title).toBe(expected);
  });

  it('4회차를 마치고 대기로 돌아가면 4회차를 모두 마쳤어요를 돌려준다', () => {
    // given
    const roomId = 'room-1';

    // when
    const { title } = buildSessionNotification(roomId, {
      mode: ROOM_MODE.IDLE,
      currentCycle: 0,
    });

    // then
    expect(title).toBe('4회차를 모두 마쳤어요');
  });

  it('같은 방의 같은 세션이면 tag가 같고, 다음 세션이면 tag가 다르다', () => {
    // given
    const roomId = 'room-1';
    const session = { mode: ROOM_MODE.FOCUS, currentCycle: 1 };
    const nextSession = { mode: ROOM_MODE.BREAK, currentCycle: 1 };

    // when
    const tag = buildSessionNotification(roomId, session).options.tag;
    const sameTag = buildSessionNotification(roomId, session).options.tag;
    const nextTag = buildSessionNotification(roomId, nextSession).options.tag;

    // then
    expect(sameTag).toBe(tag);
    expect(nextTag).not.toBe(tag);
  });
});
