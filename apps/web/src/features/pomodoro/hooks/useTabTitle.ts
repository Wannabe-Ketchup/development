import { useEffect, useRef } from 'react';
import type { Room } from '@pomodoro/shared';
import { formatTabTitle } from '../lib/tab-title';

const TAB_TITLE_REFRESH_INTERVAL_MS = 1000;

// 방 상태를 탭 제목에 보여 준다. room이 null이면(입장 전·실패, SSE 오류) 처음 제목으로 되돌린다.
// 언마운트하면 처음 제목으로 되돌린다. 1초 갱신은 React 상태 없이 document.title만 바꾼다.
export function useTabTitle(room: Room | null): void {
  const originalTitleRef = useRef(document.title);

  useEffect(() => {
    const originalTitle = originalTitleRef.current;
    if (!room) {
      document.title = originalTitle;
      return;
    }

    const updateTitle = () => {
      document.title = formatTabTitle(room, new Date());
    };
    updateTitle();
    if (room.timer.status !== 'RUNNING') return;

    const intervalId = setInterval(updateTitle, TAB_TITLE_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [room]);

  useEffect(() => {
    const originalTitle = originalTitleRef.current;
    return () => {
      document.title = originalTitle;
    };
  }, []);
}
