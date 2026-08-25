import type { Participant } from './participant.js';
import type { Timer } from './timer.js';

export type RoomMode = 'IDLE' | 'FOCUS' | 'BREAK';

export interface Room {
  roomId: string;
  participants: Participant[];
  timer: Timer;
  mode: RoomMode;
  currentCycle: number;
}
