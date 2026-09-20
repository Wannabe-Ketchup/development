import { useCallback, useEffect, useState } from 'react';
import type { Room } from '@pomodoro/shared';
import wall from '@/assets/wall.png';
import floor from '@/assets/floor.png';
import Desk from '@/assets/desk.svg?react';
import Lamp from '@/assets/lamp.svg?react';
import Shelf from '@/assets/shelf.svg?react';
import { LPPlayer } from './components/LPPlayer';
import { cn } from '@/lib/cn';
import { useTheme } from './hooks/useTheme';
import { useRoomSSE } from './hooks/useRoomSSE';
import { useRoomId } from './lib/room-id';
import { enterRoom } from '@/api/room';
import { getParticipantId, saveParticipantId } from './lib/participant-storage';
import { getSeatTranslateX } from './lib/seat-layout';
import { Participant } from './components/Participant';
import { RoomTimer } from './components/RoomTimer';

const SEAT_SPACING_PX = 182;

function Pomodoro() {
  const { theme, toggleTheme } = useTheme();
  const roomId = useRoomId();

  const [room, setRoom] = useState<Room | null>(null);
  const [selfParticipantId, setSelfParticipantId] = useState<string | null>(
    null,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasEnterRoomFailed, setHasEnterRoomFailed] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    const storedParticipantId = getParticipantId(roomId) ?? undefined;

    enterRoom(roomId, storedParticipantId)
      .then((response) => {
        if (cancelled) return;
        saveParticipantId(roomId, response.participant.id);
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
    selfParticipantId ?? undefined,
    handleRoomState,
  );

  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      {/* 배경 레이어 */}
      <div className="grid h-full w-full grid-cols-1 grid-rows-[6fr_4fr] select-none">
        <img
          className="h-full min-h-0 w-full object-cover object-bottom"
          src={wall}
          alt="벽 이미지"
        />
        <img
          className="h-full min-h-0 w-full object-cover object-top"
          src={floor}
          alt="바닥 이미지"
        />

        {theme === 'dark' && <div className="absolute inset-0 bg-black/60" />}
      </div>

      {/* 콘텐츠 레이어 */}
      <div className="absolute inset-0">
        {/* roomId가 유효하고 방 정보를 받아온 뒤에만 타이머를 보여준다 */}
        {roomId && room && <RoomTimer timer={room.timer} />}

        <div className="absolute top-[calc(60%+60px)] left-1/2 z-10 -translate-x-1/2">
          <Desk />
          <Lamp
            className={cn(
              'pointer-events-none absolute bottom-18 -left-38 cursor-pointer *:pointer-events-auto [&_.lamp-outline]:opacity-0 hover:[&_.lamp-outline]:opacity-100',
              theme === 'dark' ? 'text-lamp-off' : 'text-lamp-on',
            )}
            onClick={toggleTheme}
          />
        </div>
        <div className="absolute bottom-[40%] left-[calc(50%+428px)]">
          <Shelf />
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
          <div className="absolute top-[calc(60%+215px)] left-1/2 z-0 h-0 w-0">
            {room.participants.map((participant, index) => (
              <Participant
                key={participant.id}
                participant={participant}
                translateX={getSeatTranslateX(
                  index,
                  room.participants.length,
                  SEAT_SPACING_PX,
                )}
                isPending={participant.id === selfParticipantId && !isConfirmed}
              />
            ))}
          </div>
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
      </div>
    </div>
  );
}

export default Pomodoro;
