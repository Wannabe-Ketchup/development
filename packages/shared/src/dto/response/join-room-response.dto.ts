import type { Room } from '../../types/room.js';

export interface JoinRoomResponse {
  participant: {
    id: string;
    nickname: string;
  };
  room: Room;
}
