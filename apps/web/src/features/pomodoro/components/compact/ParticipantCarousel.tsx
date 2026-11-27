import {
  ROOM_MODE,
  type Participant as ParticipantData,
  type RoomMode,
} from '@pomodoro/shared';
import ChevronSvg from '@/assets/chevron.svg?react';
import { cn } from '@/lib/cn';
import { useHorizontalSwipe } from '../../hooks/useHorizontalSwipe';
import { getNicknameLabel } from '../../lib/nickname-label';
import { useViewportSize } from '@/hooks/useViewportSize';
import {
  getCarouselTranslateX,
  SEAT_WIDTH_PX,
  SEATS_HEIGHT_PX,
} from '../../lib/seat-layout';
import { Participant } from '../Participant';
import { CompactScene } from './CompactScene';

interface ParticipantCarouselProps {
  roomId: string;
  participants: readonly ParticipantData[];
  selfParticipantId: string | null;
  isPending: boolean;
  mode: RoomMode;
  // 지금 보는 참여자의 id
  viewedParticipantId: string | null;
  onViewParticipant: (participantId: string) => void;
}

// 폰 화면(mobile): 참여자를 한 명씩 보여 주고 화살표·스와이프로 넘긴다. 양 끝에서는 순환하지 않고, 혼자면 넘기는 버튼을 두지 않는다.
// 모두 한 줄로 그리되 화면 너비 간격으로 벌려, 보는 사람만 가운데에 보이고 넘기면 옆으로 미끄러진다. 책상은 움직이지 않는다
export function ParticipantCarousel({
  roomId,
  participants,
  selfParticipantId,
  isPending,
  mode,
  viewedParticipantId,
  onViewParticipant,
}: ParticipantCarouselProps) {
  const viewedIndex = participants.findIndex(
    (participant) => participant.id === viewedParticipantId,
  );
  const viewed = participants[viewedIndex];
  const hasPrev = 0 < viewedIndex;
  const hasNext = 0 <= viewedIndex && viewedIndex < participants.length - 1;

  const goPrev = () => {
    if (hasPrev) onViewParticipant(participants[viewedIndex - 1].id);
  };
  const goNext = () => {
    if (hasNext) onViewParticipant(participants[viewedIndex + 1].id);
  };
  const swipeHandlers = useHorizontalSwipe({ onPrev: goPrev, onNext: goNext });
  const { width: spacingPx } = useViewportSize();
  const getTranslateX = (index: number) =>
    getCarouselTranslateX(index, viewedIndex, spacingPx);

  if (!viewed) return null;

  const isSelf = viewed.id === selfParticipantId;
  const canPage = 1 < participants.length;

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      {...(canPage ? swipeHandlers : undefined)}
    >
      <CompactScene
        participantIds={participants.map((participant) => participant.id)}
        mode={mode}
        getSeatTranslateX={getTranslateX}
      >
        <ul
          aria-label="참가자 목록"
          data-tour-id="participants"
          className="absolute top-[214px] left-0 z-0 flex -translate-x-1/2 -translate-y-full items-end justify-center"
          style={{ width: SEAT_WIDTH_PX, height: SEATS_HEIGHT_PX }}
        >
          {participants.map((participant, index) => {
            const isParticipantSelf = participant.id === selfParticipantId;
            return (
              <Participant
                key={participant.id}
                roomId={roomId}
                participant={participant}
                translateX={getTranslateX(index)}
                isPending={isParticipantSelf && isPending}
                isSelf={isParticipantSelf}
                isBreak={mode === ROOM_MODE.BREAK}
                isInert={index !== viewedIndex}
                hasOneLinePlaceholder
              />
            );
          })}
        </ul>
      </CompactScene>

      {canPage && (
        <>
          <p aria-live="polite" className="sr-only">
            {`${participants.length}명 중 ${viewedIndex + 1}번째, ${isSelf ? '나' : getNicknameLabel(viewed.nickname)}`}
          </p>
          <PagerButton
            direction="prev"
            label="이전 참여자"
            isDisabled={!hasPrev}
            onClick={goPrev}
          />
          <PagerButton
            direction="next"
            label="다음 참여자"
            isDisabled={!hasNext}
            onClick={goNext}
          />
        </>
      )}
    </div>
  );
}

interface PagerButtonProps {
  direction: 'prev' | 'next';
  label: string;
  isDisabled: boolean;
  onClick: () => void;
}

function PagerButton({
  direction,
  label,
  isDisabled,
  onClick,
}: PagerButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        // 화살표 가운데는 장면 기준점(바닥선 + 24px)보다 36px 위에 둔다
        'absolute top-[calc(60%-36px)] z-8 flex size-12 items-center justify-center text-black disabled:opacity-30',
        direction === 'prev'
          ? 'left-[max(4px,calc(var(--side)-14px))]'
          : 'right-[max(4px,calc(var(--side)-14px))]',
      )}
    >
      <ChevronSvg
        aria-hidden="true"
        className={cn('size-12', direction === 'next' && '-scale-x-100')}
      />
    </button>
  );
}
