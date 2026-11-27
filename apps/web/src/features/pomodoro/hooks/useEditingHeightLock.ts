import { useEffect, useRef, useState, type RefObject } from 'react';

// 포커스가 빠진 뒤 화면 높이가 돌아오지 않아도(높이가 줄지 않는 브라우저) 이 시간이 지나면 고정을 푼다
const RELEASE_FALLBACK_MS = 1000;

function isEditable(element: EventTarget | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.isContentEditable
  );
}

// 입력칸에 포커스가 있는 동안 element의 높이를 포커스 직전 높이로 고정해 돌려준다. 입력 중이 아니면 null이다.
// 키보드가 올라오면 화면 높이 자체를 줄이는 브라우저(iOS Chrome, Android)에서 장면이 위로 눌리지 않고 키보드에 가려지게 한다.
// 포커스가 빠져도 키보드가 다 내려가 화면 높이가 돌아온 뒤에 풀어, 줄어든 높이로 그려지는 순간이 없게 한다
export function useEditingHeightLock(
  ref: RefObject<HTMLElement | null>,
): number | null {
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const lockedHeightRef = useRef<number | null>(null);

  useEffect(() => {
    let isReleasing = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const lock = (height: number | null) => {
      lockedHeightRef.current = height;
      setLockedHeight(height);
    };
    const stopReleasing = () => {
      isReleasing = false;
      clearTimeout(fallbackTimer);
    };
    const release = () => {
      stopReleasing();
      lock(null);
    };
    const handleResize = () => {
      const height = lockedHeightRef.current;
      if (isReleasing && height !== null && height <= window.innerHeight) {
        release();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isEditable(event.target) || !ref.current) return;
      // 키보드가 내려가는 중에 다시 입력하면 고정을 이어 간다
      stopReleasing();
      // 이미 고정 중이면(입력칸 사이 이동) 줄어든 높이로 다시 재지 않는다
      if (lockedHeightRef.current !== null) return;
      lock(ref.current.getBoundingClientRect().height);
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (isEditable(event.relatedTarget)) return;
      if (lockedHeightRef.current === null) return;
      isReleasing = true;
      clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(release, RELEASE_FALLBACK_MS);
      handleResize();
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', handleResize);
    };
  }, [ref]);

  return lockedHeight;
}
