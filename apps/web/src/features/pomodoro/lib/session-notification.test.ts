import { ROOM_MODE } from '@pomodoro/shared';
import { buildSessionNotification } from './session-notification';

const STARTED_AT = '2026-11-01T10:00:00.000Z';
const NEXT_STARTED_AT = '2026-11-01T10:25:00.000Z';
const NEXT_SET_STARTED_AT = '2026-11-01T12:00:00.000Z';

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
    const { title } = buildSessionNotification(roomId, session, STARTED_AT);

    // then
    expect(title).toBe(expected);
  });

  it('4회차를 마치고 대기로 돌아가면 4회차를 모두 마쳤어요를 돌려준다', () => {
    // given
    const roomId = 'room-1';

    // when
    const { title } = buildSessionNotification(
      roomId,
      { mode: ROOM_MODE.IDLE, currentCycle: 0 },
      STARTED_AT,
    );

    // then
    expect(title).toBe('4회차를 모두 마쳤어요');
  });

  it('같은 방의 같은 전환이면 tag가 같고, 다음 세션이면 tag가 다르다', () => {
    // given
    const roomId = 'room-1';
    const session = { mode: ROOM_MODE.FOCUS, currentCycle: 1 };
    const nextSession = { mode: ROOM_MODE.BREAK, currentCycle: 1 };

    // when
    const tag = buildSessionNotification(roomId, session, STARTED_AT).options
      .tag;
    const sameTag = buildSessionNotification(roomId, session, STARTED_AT)
      .options.tag;
    const nextTag = buildSessionNotification(
      roomId,
      nextSession,
      NEXT_STARTED_AT,
    ).options.tag;

    // then
    expect(sameTag).toBe(tag);
    expect(nextTag).not.toBe(tag);
  });

  it('다음 세트에서 같은 회차가 다시 시작되면 tag가 다르다', () => {
    // given
    const roomId = 'room-1';
    const session = { mode: ROOM_MODE.FOCUS, currentCycle: 1 };

    // when
    const firstSetTag = buildSessionNotification(roomId, session, STARTED_AT)
      .options.tag;
    const nextSetTag = buildSessionNotification(
      roomId,
      session,
      NEXT_SET_STARTED_AT,
    ).options.tag;

    // then
    expect(nextSetTag).not.toBe(firstSetTag);
  });
});
