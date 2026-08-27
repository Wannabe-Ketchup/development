import type { Timer as TimerShape, TimerStatus } from '@pomodoro/shared';

export class Timer implements TimerShape {
  constructor(
    public status: TimerStatus,
    public focusTimeSec: number,
    public breakTimeSec: number,
    public totalCycle: number,
    public timerStartedAt: string | null,
    public remainingTimeSec: number,
  ) {}
}
