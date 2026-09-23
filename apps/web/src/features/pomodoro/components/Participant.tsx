import type { Participant as ParticipantData } from '@pomodoro/shared';
import Chair from '@/assets/chair.svg?react';
import { Tomato } from './Tomato';
import { ParticipantNickname } from './ParticipantNickname';

interface ParticipantProps {
  roomId: string;
  participant: ParticipantData;
  translateX: number;
  isPending: boolean;
  isSelf: boolean;
}

export function Participant({
  roomId,
  participant,
  translateX,
  isPending,
  isSelf,
}: ParticipantProps) {
  return (
    <div
      className="relative transition-transform duration-300 ease-out"
      style={{ transform: `translateX(${translateX}px)` }}
    >
      <div>
        <Chair className="absolute bottom-0 left-1/2 w-36 max-w-none -translate-x-1/2" />
        {/* 의자(발밑) 기준 205px 위: 기존 두 좌표(60%+215px / 60%+10px)의 차이와 동일 */}
        <div className="absolute bottom-51.25 left-1/2 flex w-28 -translate-x-1/2 flex-col items-center gap-4">
          <div className="w-max">
            {isSelf ? (
              <ParticipantNickname
                roomId={roomId}
                participantId={participant.id}
                nickname={participant.nickname}
              />
            ) : (
              <div className="inline-flex h-9 items-center rounded-[10px] bg-white/60 px-3.5">
                <span className="text-2xl leading-[normal] tracking-[2.4px]">
                  {participant.nickname}
                </span>
              </div>
            )}
          </div>
          <Tomato isPending={isPending} />
        </div>
      </div>
    </div>
  );
}
