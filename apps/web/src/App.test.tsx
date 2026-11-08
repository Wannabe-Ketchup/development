import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./features/home/page', () => ({ default: () => <div>home</div> }));
vi.mock('./features/pomodoro/page', () => ({
  default: () => <div>pomodoro</div>,
}));

describe('App', () => {
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
});
