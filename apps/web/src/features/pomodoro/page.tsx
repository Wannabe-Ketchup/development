import { useCallback, useEffect, useRef, useState } from 'react';
import type { Room } from '@pomodoro/shared';
import wall1280 from '@/assets/wall-1280.webp?no-inline';
import wall1920 from '@/assets/wall-1920.webp';
import wall2560 from '@/assets/wall-2560.webp';
import floor1280 from '@/assets/floor-1280.webp';
import floor1920 from '@/assets/floor-1920.webp';
import floor2560 from '@/assets/floor-2560.webp';
import DeskSvg from '@/assets/desk.svg?react';
import ShelfSvg from '@/assets/shelf.svg?react';
import { WALL_SIZES, FLOOR_SIZES } from './image-sizes';
import { LPPlayer } from './components/LPPlayer';
import { useTheme } from './hooks/useTheme';
import { useRoomSSE } from './hooks/useRoomSSE';
import { useSessionChangeAlarm } from './hooks/useSessionChangeAlarm';
import { useRoomId } from '@/lib/room-id';
import { enterRoom } from '@/api/room';
import { getSeatsWidthPx, getSeatTranslateX } from './lib/seat-layout';
import { Participant } from './components/Participant';
import { RoomTimer } from './components/RoomTimer';
import { Lamp } from './components/Lamp';
import { DeskProps } from './components/DeskProps';
import { HowToUseButton } from './components/HowToUseButton';
import { CoachMarkTour } from './components/CoachMarkTour';
import { useCoachMarkTour } from './hooks/useCoachMarkTour';
import { TOTAL_STEPS } from './lib/coach-mark-steps';
import { PomodoroSession } from './components/PomodoroSession';

const SEAT_SPACING_PX = 182;
// Participant의 의자 너비(w-36)와 같은 값. 참가자 목록의 실제 너비를 계산하는 데 쓴다.
const SEAT_WIDTH_PX = 144;
// 참가자 목록 박스의 높이. 앵커(의자 바닥)에서 의자(312px)와 닉네임·토마토 묶음 윗면까지(374px) 덮는다.
// 가변 높이인 상태 메시지 말풍선은 포함하지 않는다.
const SEATS_HEIGHT_PX = 326;

function Pomodoro() {
  const { theme, toggleTheme } = useTheme();
  const roomId = useRoomId();

  const [room, setRoom] = useState<Room | null>(null);
  const [selfParticipantId, setSelfParticipantId] = useState<string | null>(
    null,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasEnterRoomFailed, setHasEnterRoomFailed] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const tour = useCoachMarkTour({ totalSteps: TOTAL_STEPS });

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    enterRoom(roomId)
      .then((response) => {
        if (cancelled) return;
        setSelfParticipantId(response.participant.id);
        setRoom(response.room);
      })
      .catch(() => {
        if (!cancelled) setHasEnterRoomFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const handleRoomState = useCallback((nextRoom: Room) => {
    setRoom(nextRoom);
    setIsConfirmed(true);
  }, []);

  const { status: sseStatus } = useRoomSSE(
    roomId ?? undefined,
    selfParticipantId !== null,
    handleRoomState,
  );

  useSessionChangeAlarm(room?.mode, room?.currentCycle);

  const canShowTour =
    !!roomId &&
    !!room &&
    !!selfParticipantId &&
    isConfirmed &&
    !hasEnterRoomFailed &&
    sseStatus !== 'error';

  // 투어 열린 상태에서 에러로 전환되면 자동 닫기
  useEffect(() => {
    if (tour.isOpen && !canShowTour) tour.closeTour();
  }, [tour, canShowTour]);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      {/* 배경 레이어 */}
      <div className="grid h-full w-full grid-cols-1 grid-rows-[6fr_4fr] select-none">
        <img
          className="h-full min-h-0 w-full object-cover object-bottom"
          src={wall2560}
          srcSet={`${wall1280} 1280w, ${wall1920} 1920w, ${wall2560} 2560w`}
          sizes={WALL_SIZES}
          alt=""
        />
        <img
          className="h-full min-h-0 w-full object-cover object-top"
          src={floor2560}
          srcSet={`${floor1280} 1280w, ${floor1920} 1920w, ${floor2560} 2560w`}
          sizes={FLOOR_SIZES}
          alt=""
        />

        {theme === 'dark' && <div className="absolute inset-0 bg-black/60" />}
      </div>

      {/* 콘텐츠 레이어 */}
      <div className="absolute inset-0">
        {/* roomId가 유효하고 방 정보를 받아온 뒤에만 타이머를 보여준다 */}
        {roomId && room && <RoomTimer timer={room.timer} />}

        {/* 방 입장이 끝난 뒤에만 시작 버튼/회차 라벨을 보여준다. 타이머와 같은 60% 기준에 붙여, 세로가 짧으면 타이머와 함께 화면 위로 잘린다 */}
        {roomId && room && selfParticipantId && (
          <div className="absolute top-[calc(60%-480px)] left-1/2 -translate-x-1/2">
            <PomodoroSession
              roomId={roomId}
              mode={room.mode}
              currentCycle={room.currentCycle}
              timerStatus={room.timer.status}
            />
          </div>
        )}

        {/* 소품은 책상 래퍼(z-10) 안에서 책상 다음에 그려 책상 위에 보이게 한다. 참여자 목록(z-0) 안에 두면 책상에 가려진다 */}
        <div className="absolute top-[calc(60%+59px)] left-1/2 z-10 -translate-x-1/2">
          <DeskSvg aria-hidden="true" />
          {room && (
            <DeskProps
              mode={room.mode}
              participantIds={room.participants.map(
                (participant) => participant.id,
              )}
              seatSpacingPx={SEAT_SPACING_PX}
            />
          )}
          <Lamp theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="absolute bottom-[40%] left-[calc(50%+428px)]">
          <ShelfSvg aria-hidden="true" />
          <LPPlayer />
        </div>

        {/* URL에 roomId가 없거나 잘못된 경우 */}
        {!roomId && (
          <div
            data-testid="invalid-room-link"
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 text-white"
          >
            잘못된 링크입니다. roomId를 확인해 주세요.
          </div>
        )}

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
            className="absolute top-[calc(60%+232px)] left-1/2 z-0 flex -translate-x-1/2 -translate-y-full items-end justify-center"
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
                isPending={participant.id === selfParticipantId && !isConfirmed}
                isSelf={participant.id === selfParticipantId}
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

        {canShowTour && (
          <HowToUseButton
            ref={triggerRef}
            isOpen={tour.isOpen}
            onClick={tour.openTour}
          />
        )}
      </div>

      {tour.isOpen && (
        <CoachMarkTour
          isOpen={tour.isOpen}
          stepIndex={tour.stepIndex}
          totalSteps={TOTAL_STEPS}
          canGoPrev={tour.canGoPrev}
          canGoNext={tour.canGoNext}
          onClose={tour.closeTour}
          onNext={tour.goNext}
          onPrev={tour.goPrev}
          triggerRef={triggerRef}
        />
      )}
    </div>
  );
}

export default Pomodoro;
