export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export interface Timer {
  status: TimerStatus;
  focusTimeSec: number;
  breakTimeSec: number;
  totalCycle: number;
  timerStartedAt: string | null;
  remainingTimeSec: number;
}
