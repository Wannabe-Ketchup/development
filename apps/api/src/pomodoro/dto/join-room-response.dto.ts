import type { Room as RoomSnapshot } from '@pomodoro/shared';

export interface JoinRoomResponse {
  participant: {
    id: string;
    nickname: string;
  };
  roomSnapshot: RoomSnapshot;
}
