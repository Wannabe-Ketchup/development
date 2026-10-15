import { renderHook } from '@testing-library/react';
import { useShake } from './useShake';

const setReducedMotion = (matches: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches }));
};

const createElement = () => {
  const element = document.createElement('div');
  const animate = vi.fn();
  element.animate = animate;
  return { element, animate };
};

describe('useShake', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ref가 요소에 연결된 상태에서 연달아 부르면 부를 때마다 처음부터 흔들린다', () => {
    // given
    setReducedMotion(false);
    const { element, animate } = createElement();
    const { result } = renderHook(() => useShake<HTMLDivElement>());
    result.current.ref.current = element;

    // when
    result.current.shake();
    result.current.shake();

    // then
    const expectedShakeCount = 2;
    expect(animate).toHaveBeenCalledTimes(expectedShakeCount);
  });

  it('동작 줄이기가 켜진 상태에서 부르면 흔들리지 않는다', () => {
    // given
    setReducedMotion(true);
    const { element, animate } = createElement();
    const { result } = renderHook(() => useShake<HTMLDivElement>());
    result.current.ref.current = element;

    // when
    result.current.shake();

    // then
    expect(animate).not.toHaveBeenCalled();
  });

  it('ref가 요소에 연결되지 않았으면 아무 일도 하지 않는다', () => {
    // given
    setReducedMotion(false);
    const { result } = renderHook(() => useShake<HTMLDivElement>());

    // when
    const shake = () => result.current.shake();

    // then
    expect(shake).not.toThrow();
  });
});
