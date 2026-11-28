import { useEffect, useState, type Ref } from 'react';
import type { Timer } from '@pomodoro/shared';
import { cn } from '@/lib/cn';
import {
  formatRemainingTime,
  getRemainingTimeSec,
} from '../lib/remaining-time';

// 데스크톱은 방 기준선(60%)에서 위로 368px에 두되, 세로가 짧으면 회차 라벨 줄(위 여백 16 + 높이 48) 아래 20에서 멈춘다.
// 좁은 화면은 위치와 글자 크기를 직접 정한다
const DESKTOP_POSITION_CLASS_NAME =
  'absolute top-[max(84px,calc(60%-368px))] left-1/2 z-15 -translate-x-1/2 text-timer';

// 손글씨 폰트에 Bold가 없어 글자 크기에 비례한 외곽선으로 두께를 더한다.
// 브라우저가 굵게 흉내 내는 font-bold는 Chrome과 Safari의 두께가 달라 모든 화면에서 이 값을 쓴다
const TIMER_STROKE_CLASS_NAME =
  'font-normal [-webkit-text-stroke:0.03em_currentColor]';

interface RoomTimerProps {
  ref?: Ref<HTMLDivElement>;
  timer: Timer;
  // 위치·글자 크기 클래스
  className?: string;
}

export function RoomTimer({
  ref,
  timer,
  className = DESKTOP_POSITION_CLASS_NAME,
}: RoomTimerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (timer.status !== 'RUNNING') return;

    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, [timer.status]);

  return (
    <div
      ref={ref}
      data-tour-id="timer"
      className={cn(TIMER_STROKE_CLASS_NAME, 'whitespace-pre', className)}
    >
      {/* 손글씨 폰트에는 고정폭 숫자가 없어 숫자마다 폭이 달라 초가 바뀔 때 타이머가 흔들린다.
          숫자를 가장 넓은 숫자(4) 폭의 칸에 하나씩 넣어 전체 폭을 고정한다.
          칸 폭은 --timer-digit-width로 바꿀 수 있다(기본 0.84em = 4의 폭 0.74em + 글자 간격) */}
      {[...formatRemainingTime(getRemainingTimeSec(timer, now))].map(
        (char, index) =>
          /\d/.test(char) ? (
            <span
              key={index}
              className="inline-block w-(--timer-digit-width,0.84em) text-center"
            >
              {char}
            </span>
          ) : (
            char
          ),
      )}
    </div>
  );
}
