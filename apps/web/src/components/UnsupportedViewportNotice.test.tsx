import { act, fireEvent, render, screen } from '@testing-library/react';
import { UnsupportedViewportNotice } from './UnsupportedViewportNotice';

describe('UnsupportedViewportNotice', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('링크 복사하기를 누르면 지금 주소를 복사하고 복사했다고 알린다', async () => {
    // given
    history.pushState({}, '', '/pomodoro/r1');
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<UnsupportedViewportNotice background={null} />);

    // when
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '링크 복사하기' }));
    });

    // then
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    screen.getByRole('button', { name: '복사했어요!' });
    expect(screen.getByRole('status').textContent).toBe('링크를 복사했어요');
  });
});
