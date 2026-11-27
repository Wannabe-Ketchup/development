import { useState, useEffect } from 'react';

function isSameRect(a: DOMRect, b: DOMRect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

function isSameRects(a: readonly DOMRect[], b: readonly DOMRect[]): boolean {
  return a.length === b.length && a.every((rect, i) => isSameRect(rect, b[i]));
}

// 리사이즈·레이아웃 변화·CSS transition처럼 이벤트 없이 바뀌는 위치까지 따라가도록 매 프레임 측정한다.
// 값이 바뀔 때만 상태를 갱신해 불필요한 리렌더링을 막는다.
// selector와 맞는 요소가 여러 개면 모두 돌려준다(없으면 빈 배열)
export function useTargetRects(selector: string | null): readonly DOMRect[] {
  const [rects, setRects] = useState<readonly DOMRect[]>([]);

  useEffect(() => {
    if (!selector) {
      setRects([]);
      return;
    }

    let frameId = 0;

    const track = () => {
      const next = [...document.querySelectorAll(selector)].map((el) =>
        el.getBoundingClientRect(),
      );
      setRects((prev) => (isSameRects(prev, next) ? prev : next));
      frameId = requestAnimationFrame(track);
    };

    track();

    return () => cancelAnimationFrame(frameId);
  }, [selector]);

  return rects;
}

// 맞는 요소 중 첫 번째의 rect. 말풍선이 붙을 기준이다
export function useTargetRect(selector: string | null): DOMRect | null {
  return useTargetRects(selector)[0] ?? null;
}
