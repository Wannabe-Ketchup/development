import { resolveRoute } from './resolve-route';

describe('resolveRoute', () => {
  it('메인 주소 / 는 home으로 판단한다', () => {
    // given
    const pathname = '/';

    // when
    const route = resolveRoute(pathname);

    // then
    const expected = 'home';
    expect(route).toBe(expected);
  });

  it('방 주소 /pomodoro/abc234 는 pomodoro로 판단한다', () => {
    // given
    const pathname = '/pomodoro/abc234';

    // when
    const route = resolveRoute(pathname);

    // then
    const expected = 'pomodoro';
    expect(route).toBe(expected);
  });

  it.each(['/pomodoro', '/asdf', '/index.html'])(
    '정의되지 않은 주소 %s 는 not-found로 판단한다',
    (pathname) => {
      // when
      const route = resolveRoute(pathname);

      // then
      const expected = 'not-found';
      expect(route).toBe(expected);
    },
  );
});
