import { useEffect, useRef } from 'react';
import type { RoomMode } from '@pomodoro/shared';

export interface Session {
  mode: RoomMode;
  currentCycle: number;
}

// mode 또는 회차가 직전과 달라질 때마다 onChange를 부른다.
// 처음 받은 세션, 같은 세션으로 다시 렌더링(일시정지·재개, 참여자 변경)에는 부르지 않는다.
// 방 정보가 없으면 undefined를 넘긴다. 그동안은 직전 세션을 그대로 기억한다.
export function useSessionChange(
  mode: RoomMode | undefined,
  currentCycle: number | undefined,
  onChange: (session: Session) => void,
): void {
  const prevSessionRef = useRef<Session | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (mode === undefined || currentCycle === undefined) return;

    const prev = prevSessionRef.current;
    prevSessionRef.current = { mode, currentCycle };
    if (prev === null) return;

    const isSessionChanged =
      prev.mode !== mode || prev.currentCycle !== currentCycle;
    if (!isSessionChanged) return;

    onChangeRef.current({ mode, currentCycle });
  }, [mode, currentCycle]);
}
