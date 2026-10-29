import { useEffect, useRef } from 'react';
import type { RoomMode } from '@pomodoro/shared';
// 출처: Pixabay "New Notification 3" (Dragon Studio)
import sessionAlarmUrl from '@/assets/session-alarm.mp3';

// 세션(mode 또는 회차)이 바뀔 때마다 알림음을 재생한다.
// 처음 받은 세션에는 울리지 않는다. 방 정보를 받기 전에는 undefined를 넘긴다.
export function useSessionChangeAlarm(
  mode: RoomMode | undefined,
  currentCycle: number | undefined,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSessionRef = useRef<{
    mode: RoomMode;
    currentCycle: number;
  } | null>(null);

  // Audio 생성 + 첫 사용자 입력 때 무음 재생으로 자동재생 잠금 해제
  useEffect(() => {
    const audio = new Audio(sessionAlarmUrl);
    audioRef.current = audio;

    const unlock = () => {
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {})
        .finally(() => {
          audio.muted = false;
        });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // 세션 변화 감지
  useEffect(() => {
    if (mode === undefined || currentCycle === undefined) return;

    const prev = prevSessionRef.current;
    prevSessionRef.current = { mode, currentCycle };
    if (prev === null) return;

    const isSessionChanged =
      prev.mode !== mode || prev.currentCycle !== currentCycle;
    if (!isSessionChanged) return;

    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    // 자동재생이 막히면 화면 표시로만 알린다
    audio.play().catch(() => {});
  }, [mode, currentCycle]);
}
