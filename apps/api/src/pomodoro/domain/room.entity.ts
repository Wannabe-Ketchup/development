import type { Room as RoomShape, RoomMode } from '@pomodoro/shared';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

export class Room implements RoomShape {
  constructor(
    public readonly roomId: string,
    public participants: Participant[],
    public timer: Timer,
    public mode: RoomMode,
    public currentCycle: number,
  ) {}
}
