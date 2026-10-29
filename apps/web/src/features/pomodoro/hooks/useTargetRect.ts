import { useState, useEffect } from 'react';

function isSameRect(a: DOMRect | null, b: DOMRect | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

// 리사이즈·레이아웃 변화·CSS transition처럼 이벤트 없이 바뀌는 위치까지 따라가도록 매 프레임 측정한다.
// 값이 바뀔 때만 상태를 갱신해 불필요한 리렌더링을 막는다.
export function useTargetRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let frameId = 0;

    const track = () => {
      const el = document.querySelector(selector);
      const next = el ? el.getBoundingClientRect() : null;
      setRect((prev) => (isSameRect(prev, next) ? prev : next));
      frameId = requestAnimationFrame(track);
    };

    track();

    return () => cancelAnimationFrame(frameId);
  }, [selector]);

  return rect;
}
