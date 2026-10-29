import type { Room } from '@pomodoro/shared';

export interface JoinRoomResponse {
  participant: {
    id: string;
    nickname: string;
  };
  room: Room;
}
