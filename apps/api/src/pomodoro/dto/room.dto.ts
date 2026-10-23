import type { Room, RoomMode, Timer, Participant } from '@pomodoro/shared';
import { Room as RoomEntity } from '../domain/room.entity';

export class RoomDto implements Room {
  private constructor(
    public readonly roomId: string,
    public readonly mode: RoomMode,
    public readonly currentCycle: number,
    public readonly timer: Timer,
    public readonly participants: Participant[],
  ) {}

  static fromEntity(room: RoomEntity): RoomDto {
    return new RoomDto(
      room.roomId,
      room.mode,
      room.currentCycle,
      {
        status: room.timer.status,
        focusTimeSec: room.timer.focusTimeSec,
        breakTimeSec: room.timer.breakTimeSec,
        totalCycle: room.timer.totalCycle,
        timerStartedAt: room.timer.timerStartedAt,
        remainingTimeSec: room.timer.remainingTimeSec,
      },
      [...room.participants.values()].map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        statusMessage: participant.statusMessage,
        currentCycle: participant.currentCycle,
      })),
    );
  }
}
