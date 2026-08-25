import type { Participant as ParticipantShape } from '@pomodoro/shared';

export class Participant implements ParticipantShape {
  constructor(
    public readonly id: string,
    public nickname: string,
    public statusMessage: string,
    public currentCycle: number,
  ) {}
}
