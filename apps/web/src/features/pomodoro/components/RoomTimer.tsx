import { useEffect, useState } from 'react';
import type { Timer } from '@pomodoro/shared';
import {
  formatRemainingTime,
  getRemainingTimeSec,
} from '../lib/remaining-time';

interface RoomTimerProps {
  timer: Timer;
}

export function RoomTimer({ timer }: RoomTimerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (timer.status !== 'RUNNING') return;

    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, [timer.status]);

  return (
    <div className="absolute top-[calc(60%-410px)] left-1/2 -translate-x-1/2 text-9xl font-bold whitespace-pre">
      {/* 손글씨 폰트에는 고정폭 숫자가 없어 숫자마다 폭이 달라 초가 바뀔 때 타이머가 흔들린다.
          숫자를 가장 넓은 숫자(4) 폭의 칸에 하나씩 넣어 전체 폭을 고정한다 */}
      {[...formatRemainingTime(getRemainingTimeSec(timer, now))].map(
        (char, index) =>
          /\d/.test(char) ? (
            <span key={index} className="inline-block w-[0.84em] text-center">
              {char}
            </span>
          ) : (
            char
          ),
      )}
    </div>
  );
}
