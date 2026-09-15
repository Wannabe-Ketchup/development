import type { Participant as ParticipantData } from '@pomodoro/shared';
import chair from '@/assets/chair.svg';
import { Tomato } from './Tomato';

interface ParticipantProps {
  participant: ParticipantData;
  translateX: number;
  isPending: boolean;
}

export function Participant({
  participant,
  translateX,
  isPending,
}: ParticipantProps) {
  return (
    <div
      className="relative transition-transform duration-300 ease-out"
      style={{ transform: `translateX(${translateX}px)` }}
    >
      <img
        src={chair}
        alt="의자"
        className="absolute bottom-0 left-1/2 w-36 max-w-none -translate-x-1/2"
      />
      {/* 의자(발밑) 기준 205px 위: 기존 두 좌표(60%+215px / 60%+10px)의 차이와 동일 */}
      <Tomato
        participant={participant}
        isPending={isPending}
        className="absolute bottom-51.25 left-1/2 -translate-x-1/2"
      />
    </div>
  );
}
