import { describe, it, expect } from 'vitest';
import { getRoomIdFromPathname } from './room-id';

describe('getRoomIdFromPathname', () => {
  it.each([
    ['/pomodoro/abc234', 'abc234'],
    ['/pomodoro/abc234/', 'abc234'],
    ['/pomodoro/abc234//', 'abc234'],
    ['/pomodoro/a%20b', 'a b'],
  ])('방 주소 %s 에서 roomId %s 를 읽는다', (pathname, expectedRoomId) => {
    // when
    const roomId = getRoomIdFromPathname(pathname);

    // then
    const expected = expectedRoomId;
    expect(roomId).toBe(expected);
  });

  it.each([
    '/pomodoro',
    '/pomodoro/',
    '/pomodoro/a/b',
    '/pomodoro//abc',
    '//pomodoro/abc',
    '/Pomodoro/abc',
    '/pomodoro/%E0%A4%A',
    '/pomodoro/%',
  ])('방 주소가 아닌 %s 에서는 null을 반환한다', (pathname) => {
    // when
    const roomId = getRoomIdFromPathname(pathname);

    // then
    const expected = null;
    expect(roomId).toBe(expected);
  });
});
