import { act, fireEvent, render, screen } from '@testing-library/react';
import Home from './page';

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

function resizeWindow(width: number, height: number) {
  setWindowSize(width, height);
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

// jsdom에는 PointerEvent가 없어 clientX·buttons가 사라진다
class PointerEventStub extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}

const SURPRISED_TOMATO_SELECTOR = '.animate-tomato-surprised-slide';
const INPUT_PLACEHOLDER = '초대 코드를 입력하세요';

describe('Home', () => {
  const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  beforeAll(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    window.PointerEvent = PointerEventStub as unknown as typeof PointerEvent;
    // 사용 설명서(IntroBook)가 움직임 줄이기 설정을 읽는다
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    setWindowSize(originalSize.width, originalSize.height);
  });

  it('레이아웃이 바뀌어도 입력한 초대 코드와 입력 단계가 유지된다', () => {
    // given
    setWindowSize(393, 852);
    render(<Home />);
    fireEvent.keyDown(screen.getByRole('button', { name: '공부 시작' }), {
      key: 'Enter',
    });
    fireEvent.click(
      screen.getByRole('button', { name: '초대받은 방 입장하기' }),
    );
    fireEvent.change(screen.getByPlaceholderText(INPUT_PLACEHOLDER), {
      target: { value: 'ABC123' },
    });
    const inputBefore = screen.getByPlaceholderText(INPUT_PLACEHOLDER);

    // when
    resizeWindow(852, 393);

    // then
    const inputAfter = screen.getByPlaceholderText(INPUT_PLACEHOLDER);
    expect(inputAfter).toBe(inputBefore);
    expect(document.activeElement).toBe(inputAfter);
    expect((inputAfter as HTMLInputElement).value).toBe('ABC123');
    expect(screen.getByRole('main').dataset.layout).toBe('landscape');
  });

  it('끄는 중 레이아웃이 바뀌면 토마토가 소파로 돌아간다', () => {
    // given
    setWindowSize(393, 852);
    const { container } = render(<Home />);
    const tomato = screen.getByRole('button', { name: '공부 시작' });
    fireEvent.pointerDown(tomato, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(tomato, {
      pointerId: 1,
      clientX: 60,
      clientY: 60,
      buttons: 1,
    });
    expect(container.querySelector(SURPRISED_TOMATO_SELECTOR)).not.toBeNull();

    // when
    resizeWindow(852, 393);

    // then
    expect(container.querySelector(SURPRISED_TOMATO_SELECTOR)).toBeNull();
    expect(
      screen
        .getByRole('button', { name: '공부 시작' })
        .getAttribute('aria-hidden'),
    ).toBeNull();
  });
});
