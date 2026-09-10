import { useEffect, useState } from 'react';
import type { Timer } from '@pomodoro/shared';
import { formatRemainingTime, getRemainingTimeSec } from '../lib/remaining-time';

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
    <div className="absolute top-[calc(60%-410px)] left-1/2 z-20 -translate-x-1/2 text-9xl font-bold tabular-nums">
      {formatRemainingTime(getRemainingTimeSec(timer, now))}
    </div>
  );
}
