import {
  ROOM_MODE,
  type Participant as ParticipantData,
  type RoomMode,
} from '@pomodoro/shared';
import {
  getSeatsWidthPx,
  getSeatTranslateX,
  SEAT_SPACING_PX,
  SEAT_WIDTH_PX,
  SEATS_HEIGHT_PX,
} from '../../lib/seat-layout';
import { Participant } from '../Participant';
import { CompactScene } from './CompactScene';

interface ParticipantRowProps {
  roomId: string;
  participants: readonly ParticipantData[];
  selfParticipantId: string | null;
  isPending: boolean;
  mode: RoomMode;
}

// 중간 화면(tablet): 데스크톱처럼 긴 책상 하나에 모든 참여자를 한 줄로 앉힌다. 줄이지 않아 화면이 좁으면 양 끝 참여자가 잘린다
export function ParticipantRow({
  roomId,
  participants,
  selfParticipantId,
  isPending,
  mode,
}: ParticipantRowProps) {
  return (
    <CompactScene
      participantIds={participants.map((participant) => participant.id)}
      mode={mode}
    >
      <ul
        aria-label="참가자 목록"
        data-tour-id="participants"
        className="absolute top-[214px] left-0 z-0 flex -translate-x-1/2 -translate-y-full items-end justify-center"
        style={{
          width: getSeatsWidthPx(
            participants.length,
            SEAT_SPACING_PX,
            SEAT_WIDTH_PX,
          ),
          height: SEATS_HEIGHT_PX,
        }}
      >
        {participants.map((participant, index) => (
          <Participant
            key={participant.id}
            roomId={roomId}
            participant={participant}
            translateX={getSeatTranslateX(
              index,
              participants.length,
              SEAT_SPACING_PX,
            )}
            isPending={participant.id === selfParticipantId && isPending}
            isSelf={participant.id === selfParticipantId}
            isBreak={mode === ROOM_MODE.BREAK}
          />
        ))}
      </ul>
    </CompactScene>
  );
}
