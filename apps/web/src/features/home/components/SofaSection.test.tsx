import { render, screen, fireEvent } from '@testing-library/react';
import { SofaSection } from './SofaSection';
import type { TomatoState } from '../hooks/tomatoReducer';
import type { useTomatoDrag } from '../hooks/useTomatoDrag';

type Handlers = ReturnType<typeof useTomatoDrag>['handlers'];

const makeHandlers = (overrides: Partial<Handlers> = {}): Handlers => ({
  onPointerDown: vi.fn(),
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onPointerCancel: vi.fn(),
  onLostPointerCapture: vi.fn(),
  onKeyDown: vi.fn(),
  ...overrides,
});

describe('SofaSection', () => {
  it('토마토가 쉬고 있을 때 키보드로 공부 시작 버튼에 접근할 수 있다', () => {
    // given
    const status: TomatoState['status'] = 'sleeping';

    // when
    render(<SofaSection tomatoStatus={status} handlers={makeHandlers()} />);
    const button = screen.getByRole('button', { name: '공부 시작' });

    // then
    expect(button.tabIndex).toBe(0);
  });

  it('토마토가 쉬고 있을 때 Space 키로 공부를 시작할 수 있다', () => {
    // given
    const handleKeyDown = vi.fn();
    render(
      <SofaSection
        tomatoStatus="sleeping"
        handlers={makeHandlers({ onKeyDown: handleKeyDown })}
      />,
    );
    const button = screen.getByRole('button', { name: '공부 시작' });

    // when
    fireEvent.keyDown(button, { key: ' ' });

    // then
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('토마토가 공부 중일 때는 키보드 탐색 경로에서 제외된다', () => {
    // given
    const status: TomatoState['status'] = 'studying';

    // when
    render(<SofaSection tomatoStatus={status} handlers={makeHandlers()} />);

    // then
    // aria-hidden="true"이므로 getByRole 대신 querySelector 사용
    const button = document.querySelector(
      'button[aria-label="공부 시작"]',
    ) as HTMLButtonElement | null;
    expect(button?.tabIndex).toBe(-1);
  });
});
