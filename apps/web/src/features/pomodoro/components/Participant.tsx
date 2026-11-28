import type { Participant as ParticipantData } from '@pomodoro/shared';
import ChairSvg from '@/assets/chair.svg?react';
import { cn } from '@/lib/cn';
import { SEAT_MOVE_TRANSITION_CLASS } from '../lib/seat-layout';
import { useSeatMoveDuration } from '../hooks/useSeatMoveDuration';
import { Tomato } from './Tomato';
import { getTomatoStage } from '../lib/tomato-stage';
import { ParticipantNickname } from './ParticipantNickname';
import { ParticipantStatusMessage } from './ParticipantStatusMessage';
import { getNicknameLabel } from '../lib/nickname-label';

interface ParticipantProps {
  roomId: string;
  participant: ParticipantData;
  translateX: number;
  isPending: boolean;
  isSelf: boolean;
  isBreak: boolean;
  // 폰에서 화면 밖에 있는 참여자. 키보드 포커스와 스크린 리더가 닿지 않게 한다
  isInert?: boolean;
  // 폰은 상태 메시지 자리표시를 한 줄로 보여 준다
  hasOneLinePlaceholder?: boolean;
}

export function Participant({
  roomId,
  participant,
  translateX,
  isPending,
  isSelf,
  isBreak,
  isInert = false,
  hasOneLinePlaceholder = false,
}: ParticipantProps) {
  const nicknameLabel = getNicknameLabel(participant.nickname);
  const moveDurationMs = useSeatMoveDuration(translateX);

  return (
    <li
      aria-label={isSelf ? `나, ${nicknameLabel}` : nicknameLabel}
      data-tour-id={isSelf ? 'self-participant' : undefined}
      inert={isInert}
      aria-hidden={isInert || undefined}
      className={cn('relative', SEAT_MOVE_TRANSITION_CLASS)}
      style={{
        transform: `translateX(${translateX}px)`,
        transitionDuration: `${moveDurationMs}ms`,
      }}
    >
      <div>
        <ChairSvg
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-auto w-32.5 max-w-none -translate-x-1/2"
        />
        <div className="absolute bottom-44.5 left-1/2 flex w-25 -translate-x-1/2 flex-col items-center gap-2.5">
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
                <span className="font-ongleipryudung text-title leading-[normal] whitespace-pre in-[.compact-safe-area]:text-title-sm">
                  {participant.nickname}
                </span>
              </div>
            )}
          </div>

          <ParticipantStatusMessage
            roomId={roomId}
            message={participant.statusMessage}
            isSelf={isSelf}
            isBreak={isBreak}
            hasOneLinePlaceholder={hasOneLinePlaceholder}
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
