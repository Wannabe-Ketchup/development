import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useStickToBottom } from './useStickToBottom';

const CLIENT_HEIGHT_PX = 150;

function StickyList() {
  const { scrollRef, contentRef, handleScroll, stickToBottom } =
    useStickToBottom<HTMLDivElement, HTMLUListElement>();
  return (
    <>
      <div ref={scrollRef} data-testid="scroll" onScroll={handleScroll}>
        <ul ref={contentRef} />
      </div>
      <button type="button" onClick={stickToBottom}>
        맨 아래로
      </button>
    </>
  );
}

describe('useStickToBottom', () => {
  let notifyResize: () => void;
  let scrollHeight: number;

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notifyResize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // jsdom에는 레이아웃이 없어 높이를 정해 준다
  function renderList() {
    scrollHeight = 500;
    render(<StickyList />);
    const list = screen.getByTestId('scroll');
    Object.defineProperties(list, {
      scrollHeight: { get: () => scrollHeight },
      clientHeight: { get: () => CLIENT_HEIGHT_PX },
    });
    scrollTo(list, scrollHeight - CLIENT_HEIGHT_PX);
    return list;
  }

  function scrollTo(list: HTMLElement, scrollTop: number) {
    list.scrollTop = scrollTop;
    fireEvent.scroll(list);
  }

  function growContent(nextScrollHeight: number) {
    scrollHeight = nextScrollHeight;
    notifyResize();
  }

  it('맨 아래를 보고 있으면 내용이 늘어도 맨 아래를 유지한다', () => {
    // given
    const list = renderList();

    // when
    growContent(600);

    // then
    expect(list.scrollTop).toBe(600);
  });

  it('위로 올려 보고 있으면 내용이 늘어도 위치를 유지한다', () => {
    // given
    const list = renderList();
    scrollTo(list, 100);

    // when
    growContent(600);

    // then
    expect(list.scrollTop).toBe(100);
  });

  it('위로 올렸다가 맨 아래로 돌아오면 다시 맨 아래를 유지한다', () => {
    // given
    const list = renderList();
    scrollTo(list, 100);
    scrollTo(list, 340);

    // when
    growContent(600);

    // then
    expect(list.scrollTop).toBe(600);
  });

  it('내려온 scroll 이벤트가 오기 전에 내용이 늘어도 맨 아래를 유지한다', () => {
    // given: 맨 아래로 내린 뒤 이벤트를 받기 전에 메시지가 더 왔다
    const list = renderList();
    list.scrollTop = 360;
    scrollHeight = 700;
    fireEvent.scroll(list);

    // when
    notifyResize();

    // then
    expect(list.scrollTop).toBe(700);
  });

  it('위로 올려 보고 있어도 stickToBottom을 부르면 맨 아래로 가고 계속 유지한다', () => {
    // given
    const list = renderList();
    scrollTo(list, 100);

    // when
    fireEvent.click(screen.getByRole('button', { name: '맨 아래로' }));

    // then
    expect(list.scrollTop).toBe(500);
    growContent(600);
    expect(list.scrollTop).toBe(600);
  });
});
