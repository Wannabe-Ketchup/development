import type { Participant } from './participant.js';
import type { Timer } from './timer.js';
import { ROOM_MODE } from '../constants/room.js';

export type RoomMode = (typeof ROOM_MODE)[keyof typeof ROOM_MODE];

export interface Room {
  roomId: string;
  participants: Participant[];
  timer: Timer;
  mode: RoomMode;
  currentCycle: number;
}
