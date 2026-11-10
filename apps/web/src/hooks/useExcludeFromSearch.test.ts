import { StrictMode, createElement, type ReactNode } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { useExcludeFromSearch } from './useExcludeFromSearch';

const CANONICAL_HREF = 'https://wannabe-ketchup.com/';

function addCanonical() {
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = CANONICAL_HREF;
  document.head.appendChild(canonical);
}

function countRobots() {
  return document.head.querySelectorAll('meta[name="robots"]').length;
}

function countCanonical() {
  return document.head.querySelectorAll('link[rel="canonical"]').length;
}

function StrictModeWrapper({ children }: { children: ReactNode }) {
  return createElement(StrictMode, null, children);
}

describe('useExcludeFromSearch', () => {
  afterEach(() => {
    // 언마운트가 head를 되돌린 뒤에 비우도록 먼저 정리한다
    cleanup();
    document.head.innerHTML = '';
  });

  it('제외하면 head에 robots noindex meta를 넣고 canonical을 뗀다', () => {
    // given
    addCanonical();

    // when
    renderHook(() => useExcludeFromSearch(true));

    // then
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex');
    expect(countCanonical()).toBe(0);
  });

  it('언마운트하면 robots meta를 빼고 canonical을 되돌린다', () => {
    // given
    addCanonical();
    const { unmount } = renderHook(() => useExcludeFromSearch(true));

    // when
    unmount();

    // then
    expect(countRobots()).toBe(0);
    expect(countCanonical()).toBe(1);
  });

  it('제외를 해제하면 robots meta를 빼고 canonical을 되돌린다', () => {
    // given
    addCanonical();
    const { rerender } = renderHook(
      ({ isExcluded }) => useExcludeFromSearch(isExcluded),
      { initialProps: { isExcluded: true } },
    );

    // when
    rerender({ isExcluded: false });

    // then
    expect(countRobots()).toBe(0);
    expect(countCanonical()).toBe(1);
  });

  it('StrictMode에서 두 번 실행돼도 robots meta는 1개이고 canonical은 없다', () => {
    // given
    addCanonical();

    // when
    renderHook(() => useExcludeFromSearch(true), {
      wrapper: StrictModeWrapper,
    });

    // then
    expect(countRobots()).toBe(1);
    expect(countCanonical()).toBe(0);
  });

  it('제외하지 않으면 head를 바꾸지 않는다', () => {
    // given
    addCanonical();

    // when
    renderHook(() => useExcludeFromSearch(false));

    // then
    expect(countRobots()).toBe(0);
    expect(countCanonical()).toBe(1);
  });
});
