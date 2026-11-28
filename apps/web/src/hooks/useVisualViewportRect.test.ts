import { act, renderHook } from '@testing-library/react';
import { useVisualViewportRect } from './useVisualViewportRect';

interface FakeViewport extends EventTarget {
  height: number;
  offsetTop: number;
  scale: number;
}

function installViewport(overrides: Partial<FakeViewport>) {
  const viewport = Object.assign(new EventTarget(), {
    height: 852,
    offsetTop: 0,
    scale: 1,
    ...overrides,
  }) as FakeViewport;
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 852,
  });
  return viewport;
}

describe('useVisualViewportRect', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'visualViewport');
    Reflect.deleteProperty(document.documentElement, 'clientHeight');
  });

  it('iOS처럼 키보드와 함께 innerHeight가 줄어도 레이아웃 높이로 키보드를 알아챈다', () => {
    // given
    const viewport = installViewport({});
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 852,
    });
    const { result } = renderHook(() => useVisualViewportRect());

    // when
    act(() => {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 520,
      });
      viewport.height = 520;
      viewport.dispatchEvent(new Event('resize'));
    });

    // then
    expect(result.current.bottomInset).toBe(332);
  });

  it('키보드가 올라오고 화면이 밀리면 보이는 영역의 위치·높이와 가려진 높이를 돌려준다', () => {
    // given
    const viewport = installViewport({});
    const { result } = renderHook(() => useVisualViewportRect());
    expect(result.current).toEqual({ top: 0, height: 852, bottomInset: 0 });

    // when
    act(() => {
      viewport.height = 520;
      viewport.offsetTop = 40;
      viewport.dispatchEvent(new Event('resize'));
    });

    // then
    expect(result.current).toEqual({ top: 40, height: 520, bottomInset: 292 });
  });

  it('확대 중이면 키보드로 보지 않고 레이아웃 뷰포트를 돌려준다', () => {
    // given
    installViewport({ height: 400, offsetTop: 100, scale: 2 });

    // when
    const { result } = renderHook(() => useVisualViewportRect());

    // then
    expect(result.current).toEqual({ top: 0, height: 852, bottomInset: 0 });
  });
});
