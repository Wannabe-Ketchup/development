import type { RoomMode } from '@pomodoro/shared';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

export class Room {
  constructor(
    public readonly roomId: string,
    public participants: Map<string, Participant>,
    public timer: Timer,
    public mode: RoomMode,
    public currentCycle: number,
  ) {}

  validateCapacity(): void {
    throw new Error('Not implemented: Room.validateCapacity()');
  }

  hasNickname(nickname: string): boolean {
    throw new Error(`Not implemented: Room.hasNickname(${nickname})`);
  }

  join(participant: Participant): void {
    throw new Error(`Not implemented: Room.join(${participant.id})`);
  }
}
