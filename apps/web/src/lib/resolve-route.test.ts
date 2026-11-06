import { resolveRoute } from './resolve-route';

describe('resolveRoute', () => {
  it.each([
    ['/pomodoro', ''],
    ['/pomodoro', '?roomId='],
    ['/', '?roomId=a'],
    ['/', '?roomId='],
    ['/pomodoro', '?roomId=a&roomId=b'],
    ['/asdf', ''],
    ['/index.html', ''],
    ['/pomodoro/x', '?roomId=a'],
    ['/pomodoro/', '?roomId=a'],
    ['//', ''],
    ['/Pomodoro', '?roomId=a'],
    ['/pomodoro', '?RoomId=a'],
  ])('정의되지 않은 주소 %s%s 는 not-found로 판단한다', (pathname, search) => {
    // when
    const route = resolveRoute(pathname, search);

    // then
    const expected = 'not-found';
    expect(route).toBe(expected);
  });

  it.each([
    ['/', ''],
    ['/', '?utm=x'],
  ])('메인 주소 %s%s 는 home으로 판단한다', (pathname, search) => {
    // when
    const route = resolveRoute(pathname, search);

    // then
    const expected = 'home';
    expect(route).toBe(expected);
  });

  it.each([
    ['/pomodoro', '?roomId=abc234'],
    ['/pomodoro', '?roomId=abc234&utm=x'],
  ])('방 주소 %s%s 는 pomodoro로 판단한다', (pathname, search) => {
    // when
    const route = resolveRoute(pathname, search);

    // then
    const expected = 'pomodoro';
    expect(route).toBe(expected);
  });
});
