import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useEditingHeightLock } from './useEditingHeightLock';

function Page() {
  const ref = useRef<HTMLDivElement>(null);
  const lockedHeight = useEditingHeightLock(ref);
  return (
    <div ref={ref} data-testid="page" data-locked={lockedHeight ?? 'none'}>
      <input aria-label="상태 메시지" />
      <input aria-label="닉네임" />
      <button type="button">버튼</button>
    </div>
  );
}

function mockPageHeight(height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    height,
  } as DOMRect);
}

describe('useEditingHeightLock', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('입력칸에 포커스하면 그 직전 높이로 고정한다', () => {
    // given
    render(<Page />);
    mockPageHeight(800);

    // when
    fireEvent.focusIn(screen.getByLabelText('상태 메시지'));

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('800');
  });

  it('포커스가 빠져도 화면 높이가 돌아올 때까지 고정을 유지한다', () => {
    // given
    render(<Page />);
    mockPageHeight(800);
    fireEvent.focusIn(screen.getByLabelText('상태 메시지'));
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);

    // when
    fireEvent.focusOut(screen.getByLabelText('상태 메시지'));

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('800');

    // when
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('none');
  });

  it('포커스가 빠진 뒤 화면 높이가 바뀌지 않아도 잠시 뒤 고정을 푼다', () => {
    // given
    vi.useFakeTimers();
    render(<Page />);
    mockPageHeight(800);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);
    fireEvent.focusIn(screen.getByLabelText('상태 메시지'));

    // when
    fireEvent.focusOut(screen.getByLabelText('상태 메시지'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('none');
    vi.useRealTimers();
  });

  it('키보드가 열린 채 다른 입력칸으로 옮기면 줄어든 높이로 다시 재지 않는다', () => {
    // given
    render(<Page />);
    mockPageHeight(800);
    fireEvent.focusIn(screen.getByLabelText('상태 메시지'));
    mockPageHeight(500);

    // when
    fireEvent.focusOut(screen.getByLabelText('상태 메시지'), {
      relatedTarget: screen.getByLabelText('닉네임'),
    });
    fireEvent.focusIn(screen.getByLabelText('닉네임'));

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('800');
  });

  it('입력칸이 아닌 요소에 포커스하면 고정하지 않는다', () => {
    // given
    render(<Page />);
    mockPageHeight(800);

    // when
    fireEvent.focusIn(screen.getByRole('button', { name: '버튼' }));

    // then
    expect(screen.getByTestId('page').dataset.locked).toBe('none');
  });
});
