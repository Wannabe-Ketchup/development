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
}
