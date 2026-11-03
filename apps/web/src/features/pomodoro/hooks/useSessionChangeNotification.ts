import { useEffect, useRef, type RefObject } from 'react';
import type { RoomMode } from '@pomodoro/shared';
import {
  isUserAwayFromPage,
  showNotificationIfPermitted,
} from '../lib/browser-notification';
import { buildSessionNotification } from '../lib/session-notification';
import { useSessionChange } from './useSessionChange';

function closeShownNotification(ref: RefObject<Notification | null>): void {
  ref.current?.close();
  ref.current = null;
}

// 세션이 바뀌는 순간 사용자가 화면을 보고 있지 않으면 브라우저 알림을 띄운다.
// 알림이 쌓이지 않게, 새 알림을 띄울 때와 사용자가 방 화면으로 돌아왔을 때 이 탭이 띄운 직전 알림을 닫는다.
// 방 상태를 믿을 수 없을 때(입장 전·실패, SSE 오류)는 roomId 등에 undefined를 넘긴다.
export function useSessionChangeNotification(
  roomId: string | undefined,
  mode: RoomMode | undefined,
  currentCycle: number | undefined,
  timerStartedAt: string | null | undefined,
): void {
  // 대기로 돌아오면 timerStartedAt이 비므로, 알림 tag에 쓸 직전 세션의 시작 시각을 기억해 둔다
  const lastStartedAtRef = useRef<string | null>(null);
  const shownNotificationRef = useRef<Notification | null>(null);

  useSessionChange(mode, currentCycle, (session) => {
    if (roomId === undefined) return;
    if (!isUserAwayFromPage()) return;
    const sessionStartedAt = timerStartedAt ?? lastStartedAtRef.current;
    const { title, options } = buildSessionNotification(
      roomId,
      session,
      sessionStartedAt,
    );
    closeShownNotification(shownNotificationRef);
    shownNotificationRef.current = showNotificationIfPermitted(title, options);
  });

  useEffect(() => {
    if (timerStartedAt) lastStartedAtRef.current = timerStartedAt;
  }, [timerStartedAt]);

  useEffect(() => {
    const closeWhenUserIsBack = () => {
      if (isUserAwayFromPage()) return;
      closeShownNotification(shownNotificationRef);
    };
    window.addEventListener('focus', closeWhenUserIsBack);
    document.addEventListener('visibilitychange', closeWhenUserIsBack);
    return () => {
      window.removeEventListener('focus', closeWhenUserIsBack);
      document.removeEventListener('visibilitychange', closeWhenUserIsBack);
    };
  }, []);
}
