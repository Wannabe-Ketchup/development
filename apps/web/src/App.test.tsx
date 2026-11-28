import { cleanup, render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./features/home/page', () => ({ default: () => <div>home</div> }));
vi.mock('./features/pomodoro/page', () => ({
  default: () => <div>pomodoro</div>,
}));

function countRobots() {
  return document.head.querySelectorAll('meta[name="robots"]').length;
}

describe('App', () => {
  afterEach(() => {
    // 언마운트가 head를 되돌린 뒤에 비우도록 먼저 정리한다
    cleanup();
    document.head.innerHTML = '';
  });

  it('알 수 없는 주소로 접속하면 404 화면이 보인다', () => {
    // given
    history.pushState({}, '', '/asdf');

    // when
    render(<App />);

    // then
    expect(
      screen.getByRole('heading', { name: '페이지를 찾을 수 없어요' }),
    ).toBeTruthy();
  });

  it('메인 주소는 검색에서 제외되지 않는다', () => {
    // given
    history.pushState({}, '', '/');

    // when
    render(<App />);

    // then
    expect(countRobots()).toBe(0);
  });

  it.each(['/pomodoro/abc123', '/asdf'])(
    '방 주소와 없는 주소는 검색에서 제외된다 (%s)',
    (pathname) => {
      // given
      history.pushState({}, '', pathname);

      // when
      render(<App />);

      // then
      const robots = document.head.querySelector('meta[name="robots"]');
      expect(robots?.getAttribute('content')).toBe('noindex');
    },
  );

  describe('화면 크기에 따라', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    afterEach(() => {
      window.innerWidth = originalWidth;
      window.innerHeight = originalHeight;
    });

    it('낮은 창에서도 없는 주소는 404를 그대로 보여 주고 검색에서 제외된다', () => {
      // given
      window.innerWidth = 1200;
      window.innerHeight = 400;
      history.pushState({}, '', '/asdf');

      // when
      render(<App />);

      // then
      screen.getByRole('heading', { name: '페이지를 찾을 수 없어요' });
      expect(countRobots()).toBe(1);
    });

    it('방은 낮은 창에서도 안내 없이 방 화면을 그린다', () => {
      // given
      window.innerWidth = 1200;
      window.innerHeight = 400;
      history.pushState({}, '', '/pomodoro/abc123');

      // when
      render(<App />);

      // then
      screen.getByText('pomodoro');
      expect(countRobots()).toBe(1);
    });
  });
});
