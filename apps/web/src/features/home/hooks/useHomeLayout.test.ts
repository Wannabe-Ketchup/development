import { act, renderHook } from '@testing-library/react';
import { useHomeLayout } from './useHomeLayout';

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

describe('useHomeLayout', () => {
  const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  afterEach(() => {
    setWindowSize(originalSize.width, originalSize.height);
    document.body.innerHTML = '';
  });

  it('입력칸에 포커스가 있을 때 높이만 줄면 레이아웃을 유지한다', () => {
    // given
    setWindowSize(393, 852);
    const { result } = renderHook(() => useHomeLayout());
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();

    // when
    resizeWindow(393, 300);

    // then
    expect(result.current).toBe('portrait');
  });

  it('입력 포커스 중이라도 너비가 바뀌면 다시 정한다', () => {
    // given
    setWindowSize(393, 852);
    const { result } = renderHook(() => useHomeLayout());
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();

    // when
    resizeWindow(852, 393);

    // then
    expect(result.current).toBe('landscape');
  });

  it('포커스가 없으면 높이 변화로도 바뀐다', () => {
    // given
    setWindowSize(393, 852);
    const { result } = renderHook(() => useHomeLayout());

    // when
    resizeWindow(393, 300);

    // then
    expect(result.current).toBe('landscape');
  });
});
