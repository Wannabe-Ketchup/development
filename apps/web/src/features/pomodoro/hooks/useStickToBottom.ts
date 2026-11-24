import { useCallback, useEffect, useRef } from 'react';

// 이 안쪽이면 맨 아래를 보고 있는 것으로 본다
const BOTTOM_THRESHOLD_PX = 16;

// 맨 아래를 보고 있으면 내용이 늘거나 목록 높이가 바뀌어도 맨 아래를 유지하고,
// 위로 올려 지난 내용을 보고 있으면 그 위치를 그대로 둔다
export function useStickToBottom<
  TScroll extends HTMLElement,
  TContent extends HTMLElement,
>() {
  const scrollRef = useRef<TScroll>(null);
  const contentRef = useRef<TContent>(null);
  const isStuckRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const stickToBottom = useCallback(() => {
    isStuckRef.current = true;
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }, []);

  // 크기가 바뀐 프레임을 그리기 전에 불려, 아래로 내려가는 움직임이 보이지 않는다
  useEffect(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;
    const observer = new ResizeObserver(() => {
      if (isStuckRef.current) stickToBottom();
    });
    observer.observe(scroll);
    observer.observe(content);
    return () => observer.disconnect();
  }, [stickToBottom]);

  // scroll 이벤트는 한 프레임 늦게 와서, 그사이 메시지가 늘면 내려와 있어도 맨 아래가 아닌 것으로 보인다.
  // 그래서 맨 아래가 아니라는 것만으로 풀지 않고, 위로 올렸을 때만 푼다
  const handleScroll = () => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const { scrollTop, scrollHeight, clientHeight } = scroll;
    const isAtBottom =
      scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD_PX;
    const hasScrolledUp = scrollTop < lastScrollTopRef.current;

    if (isAtBottom) isStuckRef.current = true;
    else if (hasScrolledUp) isStuckRef.current = false;
    lastScrollTopRef.current = scrollTop;
  };

  return { scrollRef, contentRef, handleScroll, stickToBottom };
}
