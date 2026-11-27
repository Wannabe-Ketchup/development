import { useEffect, useRef, useState } from 'react';
import { ROOM_MODE } from '@pomodoro/shared';
import DeskSvg from '@/assets/desk.svg?react';
import ShelfSvg from '@/assets/shelf.svg?react';
import { LPPlayer } from './components/LPPlayer';
import { RoomBackground } from './components/RoomBackground';
import { useTheme } from './hooks/useTheme';
import type { RoomSession } from './hooks/useRoomSession';
import { cn } from '@/lib/cn';
import {
  getSeatsWidthPx,
  getSeatTranslateX,
  SEAT_SPACING_PX,
  SEAT_WIDTH_PX,
  SEATS_HEIGHT_PX,
} from './lib/seat-layout';
import { Participant } from './components/Participant';
import { RoomTimer } from './components/RoomTimer';
import { Lamp } from './components/Lamp';
import { DeskProps } from './components/DeskProps';
import { InviteCodeButton } from './components/InviteCodeButton';
import { TimerSettingsButton } from './components/TimerSettingsButton';
import { HowToUseButton } from './components/HowToUseButton';
import { FeedbackButton } from './components/FeedbackButton';
import { CoachMarkTour } from './components/CoachMarkTour';
import { useCoachMarkTour } from './hooks/useCoachMarkTour';
import { TimerElementContext } from './hooks/useCoversTimer';
import { DESKTOP_COACH_MARK_STEPS } from './lib/coach-mark-steps';
import { Chat } from './components/Chat';
import { PomodoroSession } from './components/PomodoroSession';

interface PomodoroProps {
  session: RoomSession;
}

function Pomodoro({ session }: PomodoroProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const {
    roomId,
    room,
    selfParticipantId,
    isConfirmed,
    hasEnterRoomFailed,
    sseStatus,
    canShowTour,
    chat,
  } = session;

  const triggerRef = useRef<HTMLButtonElement>(null);
  // 상태 메시지가 타이머와 겹치는지 재는 데 쓴다
  const [timerElement, setTimerElement] = useState<HTMLDivElement | null>(null);
  const tour = useCoachMarkTour({
    totalSteps: DESKTOP_COACH_MARK_STEPS.length,
  });

  // 투어 열린 상태에서 에러로 전환되면 자동 닫기
  useEffect(() => {
    if (tour.isOpen && !canShowTour) tour.closeTour();
  }, [tour, canShowTour]);

  return (
    <TimerElementContext value={timerElement}>
      <div className="relative h-full w-full overflow-hidden">
        {/* 배경 레이어 */}
        <RoomBackground isDarkMode={isDarkMode} />

        {/* 콘텐츠 레이어. 쌓는 순서: 장면(참여자 z-0 < 책상 z-10) < 타이머·회차 라벨 줄(z-15) < 떠 있는 버튼(z-20) < 오류 안내(z-30). 좁은 화면(compact-page)도 같은 순서다 */}
        <div className="absolute inset-0">
          {/* roomId가 유효하고 방 정보를 받아온 뒤에만 타이머를 보여준다 */}
          {roomId && room && (
            <RoomTimer ref={setTimerElement} timer={room.timer} />
          )}

          {/* 방 입장이 끝난 뒤에만 시작 버튼/회차 라벨을 보여준다. 타이머와 같은 60% 기준에 붙이되, 세로가 짧아도 화면 위로 잘리지 않게 위 여백 16에서 멈춘다 */}
          {roomId && room && selfParticipantId && (
            <div
              data-tour-id="timer-controls"
              className={cn(
                'absolute top-[max(16px,calc(60%-436px))] left-1/2 z-15 -translate-x-1/2',
                isDarkMode && 'dark-mode-dim',
              )}
            >
              <PomodoroSession
                roomId={roomId}
                mode={room.mode}
                currentCycle={room.currentCycle}
                timerStatus={room.timer.status}
              />
            </div>
          )}

          {/* 소품은 책상 래퍼(z-10) 안에서 책상 다음에 그려 책상 위에 보이게 한다. 참여자 목록(z-0) 안에 두면 책상에 가려진다 */}
          <div className="absolute top-[calc(60%+57px)] left-1/2 z-10 -translate-x-1/2">
            {/* 램프는 어둡게 하지 않으므로 래퍼 밖에 둔다. 래퍼 크기가 책상 SVG와 같아서 소품 위치는 바뀌지 않는다 */}
            <div className={cn('relative', isDarkMode && 'dark-mode-dim')}>
              <DeskSvg aria-hidden="true" className="h-auto w-210 max-w-none" />
              {room && (
                <DeskProps
                  mode={room.mode}
                  participantIds={room.participants.map(
                    (participant) => participant.id,
                  )}
                />
              )}
            </div>
            <Lamp theme={theme} onToggle={toggleTheme} />
          </div>
          {/* 선반과 LP 플레이어를 함께 낮춘다 */}
          <div
            className={cn(
              'absolute bottom-[40%] left-[calc(50%+385px)]',
              isDarkMode && 'dark-mode-dim',
            )}
          >
            <ShelfSvg aria-hidden="true" className="h-auto w-50.5" />
            <LPPlayer />
          </div>

          {/* roomId는 있지만 입장 API 호출이 실패한 경우 */}
          {roomId && hasEnterRoomFailed && (
            <div
              data-testid="enter-room-error"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
            >
              방에 입장할 수 없습니다.
            </div>
          )}

          {/* 참여자마다 의자+캐릭터를 함께 렌더링한다. 책상(z-10)보다 아래(z-0)에 둬도, 캐릭터는 디자인상 책상과 겹치지 않아 의자 다리만 책상 뒤로 가려진다 */}
          {roomId && room && (
            <ul
              aria-label="참가자 목록"
              data-tour-id="participants"
              // li는 너비 0으로 박스 아래 중앙(기존 앵커 지점)에 모이므로 자식 배치는 그대로다. 박스는 코치마크 타겟의 실제 크기를 위한 것이다.
              className={cn(
                'absolute top-[calc(60%+214px)] left-1/2 z-0 flex -translate-x-1/2 -translate-y-full items-end justify-center',
                isDarkMode && 'dark-mode-dim',
              )}
              style={{
                width: getSeatsWidthPx(
                  room.participants.length,
                  SEAT_SPACING_PX,
                  SEAT_WIDTH_PX,
                ),
                height: SEATS_HEIGHT_PX,
              }}
            >
              {room.participants.map((participant, index) => (
                <Participant
                  key={participant.id}
                  roomId={roomId}
                  participant={participant}
                  translateX={getSeatTranslateX(
                    index,
                    room.participants.length,
                    SEAT_SPACING_PX,
                  )}
                  isPending={
                    participant.id === selfParticipantId && !isConfirmed
                  }
                  isSelf={participant.id === selfParticipantId}
                  isBreak={room.mode === ROOM_MODE.BREAK}
                />
              ))}
            </ul>
          )}

          {/* 입장은 됐지만 실시간 연결(SSE)이 끊긴 경우 */}
          {roomId && sseStatus === 'error' && (
            <div
              data-testid="sse-error"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
            >
              실시간 연결에 실패했습니다.
            </div>
          )}

          {canShowTour && roomId && room && (
            <div className="absolute top-7 right-7 z-20 flex items-center gap-5.5">
              {/* dim은 버튼 요소에 건다. 모달은 버튼의 형제로 렌더링되어 영향을 받지 않는다 */}
              <TimerSettingsButton
                roomId={roomId}
                timer={room.timer}
                isEditable={room.mode === ROOM_MODE.IDLE}
                onOpen={tour.closeTour}
                className={cn(isDarkMode && 'dark-mode-dim')}
              />
              <InviteCodeButton
                roomId={roomId}
                onOpen={tour.closeTour}
                className={cn(isDarkMode && 'dark-mode-dim')}
              />
              <FeedbackButton
                onOpen={tour.closeTour}
                className={cn(isDarkMode && 'dark-mode-dim')}
              />
            </div>
          )}

          {/* 연결이 잠깐 끊겨도(sseStatus error) 쓰던 내용이 사라지지 않게 마운트를 유지한다. 그동안은 위 안내가 덮는다 */}
          {roomId && selfParticipantId && isConfirmed && (
            <div
              className={cn(
                'absolute top-5.5 left-6.5 z-20',
                isDarkMode && 'dark-mode-dim',
              )}
            >
              <Chat
                selfParticipantId={selfParticipantId}
                chat={chat}
                onOpen={tour.closeTour}
              />
            </div>
          )}

          {canShowTour && (
            <HowToUseButton
              ref={triggerRef}
              isOpen={tour.isOpen}
              onClick={tour.openTour}
              className={cn(isDarkMode && 'dark-mode-dim')}
            />
          )}
        </div>

        {tour.isOpen && (
          <CoachMarkTour
            steps={DESKTOP_COACH_MARK_STEPS}
            isOpen={tour.isOpen}
            stepIndex={tour.stepIndex}
            canGoPrev={tour.canGoPrev}
            canGoNext={tour.canGoNext}
            onClose={tour.closeTour}
            onNext={tour.goNext}
            onPrev={tour.goPrev}
            triggerRef={triggerRef}
          />
        )}
      </div>
    </TimerElementContext>
  );
}

export default Pomodoro;
