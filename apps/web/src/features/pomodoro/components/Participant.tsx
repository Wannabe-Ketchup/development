import type { Participant as ParticipantData } from '@pomodoro/shared';
import ChairSvg from '@/assets/chair.svg?react';
import { Tomato } from './Tomato';
import { getTomatoStage } from '../lib/tomato-stage';
import { ParticipantNickname } from './ParticipantNickname';
import { ParticipantStatusMessage } from './ParticipantStatusMessage';

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
    <li
      aria-label={isSelf ? `나, ${participant.nickname}` : participant.nickname}
      data-tour-id={isSelf ? 'self-participant' : undefined}
      className="relative transition-transform duration-300 ease-out"
      style={{ transform: `translateX(${translateX}px)` }}
    >
      <div>
        <ChairSvg
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 w-36 max-w-none -translate-x-1/2"
        />
        <div className="absolute bottom-50.5 left-1/2 flex w-28 -translate-x-1/2 flex-col items-center gap-3">
          {/* DOM 순서: 닉네임→상태 (스크린 리더용)
              시각 순서: 상태→닉네임→토마토 (order로 제어) */}
          <div className="order-2 w-max">
            {isSelf ? (
              <ParticipantNickname
                roomId={roomId}
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

          <ParticipantStatusMessage
            roomId={roomId}
            message={participant.statusMessage}
            isSelf={isSelf}
            className="order-1"
          />
          <Tomato
            stage={getTomatoStage(participant.completedCycles)}
            isPending={isPending}
            className="order-3"
          />
        </div>
      </div>
    </li>
  );
}
