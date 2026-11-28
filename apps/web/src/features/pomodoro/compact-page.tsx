import { useEffect, useRef, useState } from 'react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { CompactLayout } from '@/lib/viewport-mode';
import { CoachMarkTour } from './components/CoachMarkTour';
import { BrowserEdgeStrips } from './components/compact/BrowserEdgeStrips';
import { CompactChat } from './components/compact/CompactChat';
import { CompactControlBar } from './components/compact/CompactControlBar';
import { CompactTopBar } from './components/compact/CompactTopBar';
import { ParticipantCarousel } from './components/compact/ParticipantCarousel';
import { ParticipantDots } from './components/compact/ParticipantDots';
import { ParticipantRow } from './components/compact/ParticipantRow';
import { RoomBackground } from './components/RoomBackground';
import { RoomTimer } from './components/RoomTimer';
import { useCoachMarkTour } from './hooks/useCoachMarkTour';
import { useEditingHeightLock } from './hooks/useEditingHeightLock';
import { TimerElementContext } from './hooks/useCoversTimer';
import type { RoomSession } from './hooks/useRoomSession';
import {
  MOBILE_COACH_MARK_STEPS,
  TABLET_COACH_MARK_STEPS,
} from './lib/coach-mark-steps';
import { resolveViewedParticipantId } from './lib/participant-carousel';

// 좌우 여백(--side)과 타이머 위치·글자 크기. 폰은 360 폭 이하에서 여백 16, 375 이하(SE 포함)에서 글자 72다.
// 폰 타이머는 위 버튼 줄과 32px 띄우고, 숫자 칸을 4의 폭(0.74em)에 가깝게 좁힌다("44"도 약 3px 떨어진다).
// 상태 메시지 자리표시를 한 줄로 줄인 만큼 내려, 겹치지 않는 최소 높이(약 605)는 그대로다
const LAYOUT_CLASS_NAME: Record<
  CompactLayout,
  { root: string; timer: string }
> = {
  mobile: {
    root: '[--side:16px] min-[361px]:[--side:20px]',
    timer:
      'top-[calc(var(--safe-top)+84px)] text-timer-sm [--timer-digit-width:0.78em] min-[376px]:text-timer-mobile',
  },
  tablet: {
    root: '[--side:24px]',
    timer: 'top-[calc(var(--safe-top)+52px)] text-timer-tablet',
  },
};

// 숫자 폭만큼만 차지해야 사용 안내 하이라이트와 상태 메시지 겹침 판단이 숫자 영역에 맞는다.
// 쌓는 순서: 장면(z-4) < 타이머(z-5) < 넘기기 버튼(z-8) < 아래 조작 줄(z-9) < 위 버튼 줄(z-10) < 오류 안내(z-30). 데스크톱도 같은 순서다
const TIMER_POSITION_CLASS_NAME =
  'absolute left-1/2 z-5 -translate-x-1/2 leading-[1.15]';

interface CompactPomodoroProps {
  layout: CompactLayout;
  session: RoomSession;
}

// 너비 1080 미만의 방 화면. 폰(mobile)은 참여자를 한 명씩, 중간(tablet)은 한 줄로 보여 준다.
// 조명·LP·다크 모드는 없고 배경은 항상 밝다
export function CompactPomodoro({ layout, session }: CompactPomodoroProps) {
  const {
    roomId,
    room,
    selfParticipantId,
    isConfirmed,
    hasEnterRoomFailed,
    hasMovedToAnotherRoom,
    sseStatus,
    canShowTour,
    chat,
  } = session;

  const steps =
    layout === 'mobile' ? MOBILE_COACH_MARK_STEPS : TABLET_COACH_MARK_STEPS;
  const tour = useCoachMarkTour({ totalSteps: steps.length });
  const { closeTour } = tour;
  const howToUseRef = useRef<HTMLButtonElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const lockedHeight = useEditingHeightLock(pageRef);
  // 상태 메시지가 타이머와 겹치는지 재는 데 쓴다
  const [timerElement, setTimerElement] = useState<HTMLDivElement | null>(null);

  // 폰에서 보고 있는 참여자. 처음이거나 나갔으면 본인이다
  const [viewedParticipantId, setViewedParticipantId] = useState<string | null>(
    null,
  );
  const participants = room?.participants ?? [];
  const viewedId = resolveViewedParticipantId(
    participants.map((participant) => participant.id),
    viewedParticipantId,
    selfParticipantId,
  );
  const viewedIndex = participants.findIndex(
    (participant) => participant.id === viewedId,
  );

  // 투어 열린 상태에서 에러로 전환되면 자동 닫기
  useEffect(() => {
    if (tour.isOpen && !canShowTour) closeTour();
  }, [tour.isOpen, canShowTour, closeTour]);

  // 화면이 mobile ↔ tablet으로 바뀌면 단계 목록이 달라지므로 투어를 닫는다
  useEffect(() => {
    closeTour();
  }, [layout, closeTour]);

  // 폰의 참여자 단계는 본인 화면에서 시작해야 상태 메시지·닉네임 단계 대상이 있다
  const handleOpenTour = () => {
    if (layout === 'mobile') setViewedParticipantId(selfParticipantId);
    tour.openTour();
  };

  return (
    <TimerElementContext value={timerElement}>
      {/* 입력 중에는 높이를 고정해, 키보드로 화면 높이가 줄어드는 브라우저에서도 장면이 눌리지 않고 키보드에 가려진다 */}
      <div
        ref={pageRef}
        data-room-page
        style={lockedHeight === null ? undefined : { height: lockedHeight }}
        className={`relative h-dvh w-dvw overflow-hidden compact-safe-area ${LAYOUT_CLASS_NAME[layout].root}`}
      >
        {/* 스크롤하지 않는다. 화면이 낮으면 위·아래 버튼 줄이 장면을 가린다 */}
        <div className="relative h-full">
          <BrowserEdgeStrips />
          <div className="absolute inset-0">
            <RoomBackground isDarkMode={false} />
          </div>

          {roomId && room && (
            <RoomTimer
              ref={setTimerElement}
              timer={room.timer}
              className={`${TIMER_POSITION_CLASS_NAME} ${LAYOUT_CLASS_NAME[layout].timer}`}
            />
          )}

          {roomId && room && layout === 'mobile' && (
            <ParticipantCarousel
              roomId={roomId}
              participants={room.participants}
              selfParticipantId={selfParticipantId}
              isPending={!isConfirmed}
              mode={room.mode}
              viewedParticipantId={viewedId}
              onViewParticipant={setViewedParticipantId}
            />
          )}
          {roomId && room && layout === 'tablet' && (
            <ParticipantRow
              roomId={roomId}
              participants={room.participants}
              selfParticipantId={selfParticipantId}
              isPending={!isConfirmed}
              mode={room.mode}
            />
          )}

          {roomId && hasEnterRoomFailed && (
            <div
              data-testid="enter-room-error"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
            >
              방에 입장할 수 없습니다.
            </div>
          )}

          {/* 다른 방에 입장해 이 방에서 퇴장된 경우. SSE 실패 안내보다 우선한다 */}
          {roomId && hasMovedToAnotherRoom && (
            <div
              data-testid="moved-room-notice"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
            >
              다른 방에 입장해서 이 방에서 퇴장되었습니다.
            </div>
          )}

          {roomId && sseStatus === 'error' && !hasMovedToAnotherRoom && (
            <div
              data-testid="sse-error"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
            >
              실시간 연결에 실패했습니다.
            </div>
          )}

          {canShowTour && roomId && room && (
            <CompactTopBar
              roomId={roomId}
              timer={room.timer}
              isTimerEditable={room.mode === ROOM_MODE.IDLE}
              isTourOpen={tour.isOpen}
              howToUseRef={howToUseRef}
              onOpenTour={handleOpenTour}
              onOpenModal={closeTour}
            >
              {layout === 'mobile' && 1 < room.participants.length && (
                <ParticipantDots
                  total={room.participants.length}
                  index={viewedIndex}
                />
              )}
            </CompactTopBar>
          )}

          {roomId && room && selfParticipantId && (
            <CompactControlBar
              roomId={roomId}
              mode={room.mode}
              currentCycle={room.currentCycle}
              timerStatus={room.timer.status}
            >
              {/* 연결이 잠깐 끊겨도(sseStatus error) 쓰던 내용이 사라지지 않게 마운트를 유지한다. 그동안은 위 안내가 덮는다 */}
              {isConfirmed && (
                <CompactChat
                  layout={layout}
                  selfParticipantId={selfParticipantId}
                  chat={chat}
                  onOpen={closeTour}
                />
              )}
            </CompactControlBar>
          )}
        </div>

        {tour.isOpen && (
          <CoachMarkTour
            steps={steps}
            isOpen={tour.isOpen}
            stepIndex={tour.stepIndex}
            canGoPrev={tour.canGoPrev}
            canGoNext={tour.canGoNext}
            onClose={tour.closeTour}
            onNext={tour.goNext}
            onPrev={tour.goPrev}
            triggerRef={howToUseRef}
          />
        )}
      </div>
    </TimerElementContext>
  );
}
