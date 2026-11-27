import { createContext, useContext, useLayoutEffect, useState } from 'react';

// 방 화면의 타이머 요소. 겹침을 재는 쪽(상태 메시지)이 읽는다
export const TimerElementContext = createContext<HTMLElement | null>(null);

// 요소가 화면에서 타이머와 겹치는지. 창 크기, 두 요소의 크기, 좌석 이동(transition)이 바뀔 때마다 다시 잰다.
// 겹쳐서 숨겨도 visibility만 바꾸면 자리는 남아 있어 계속 잴 수 있다
export function useCoversTimer(target: HTMLElement | null): boolean {
  const timer = useContext(TimerElementContext);
  const [isCovering, setIsCovering] = useState(false);

  useLayoutEffect(() => {
    if (!target || !timer) {
      setIsCovering(false);
      return;
    }

    const measure = () => {
      const a = target.getBoundingClientRect();
      const b = timer.getBoundingClientRect();
      setIsCovering(
        a.top < b.bottom &&
          b.top < a.bottom &&
          a.left < b.right &&
          b.left < a.right,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    observer.observe(timer);
    window.addEventListener('resize', measure);
    document.addEventListener('transitionend', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('transitionend', measure);
    };
  }, [target, timer]);

  return isCovering;
}
