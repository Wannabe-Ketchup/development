import type { Timer } from '@pomodoro/shared';

// 초 단위의 남은 시간을 "MM : SS" 형식으로 변환
export function formatRemainingTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
}

// 타이머 상태와 현재 시간을 기반으로 남은 시간을 초 단위로 계산
export function getRemainingTimeSec(timer: Timer, now: Date): number {
  if (timer.status === 'IDLE') {
    return timer.focusTimeSec;
  }

  if (timer.status === 'PAUSED' || !timer.timerStartedAt) {
    return timer.remainingTimeSec;
  }

  // 경과 시간
  const elapsedSec = Math.floor(
    (now.getTime() - new Date(timer.timerStartedAt).getTime()) / 1000,
  );

  return Math.max(0, timer.remainingTimeSec - elapsedSec);
}
