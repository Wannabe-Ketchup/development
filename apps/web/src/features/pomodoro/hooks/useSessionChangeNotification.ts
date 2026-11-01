import { useEffect, useRef } from 'react';
import type { RoomMode } from '@pomodoro/shared';
import {
  isUserAwayFromPage,
  showNotificationIfPermitted,
} from '../lib/browser-notification';
import { buildSessionNotification } from '../lib/session-notification';
import { useSessionChange } from './useSessionChange';

// 세션이 바뀌는 순간 사용자가 화면을 보고 있지 않으면 브라우저 알림을 띄운다.
// 방 상태를 믿을 수 없을 때(입장 전·실패, SSE 오류)는 roomId 등에 undefined를 넘긴다.
export function useSessionChangeNotification(
  roomId: string | undefined,
  mode: RoomMode | undefined,
  currentCycle: number | undefined,
  timerStartedAt: string | null | undefined,
): void {
  // 대기로 돌아오면 timerStartedAt이 비므로, 알림 tag에 쓸 직전 세션의 시작 시각을 기억해 둔다
  const lastStartedAtRef = useRef<string | null>(null);

  useSessionChange(mode, currentCycle, (session) => {
    if (roomId === undefined) return;
    if (!isUserAwayFromPage()) return;
    const sessionStartedAt = timerStartedAt ?? lastStartedAtRef.current;
    const { title, options } = buildSessionNotification(
      roomId,
      session,
      sessionStartedAt,
    );
    showNotificationIfPermitted(title, options);
  });

  useEffect(() => {
    if (timerStartedAt) lastStartedAtRef.current = timerStartedAt;
  }, [timerStartedAt]);
}
