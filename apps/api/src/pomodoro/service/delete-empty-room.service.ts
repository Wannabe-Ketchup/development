import { Injectable } from '@nestjs/common';
import { InviteCodeRepository } from '../repository/invite-code.repository';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';

@Injectable()
export class DeleteEmptyRoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly inviteCodeRepository: InviteCodeRepository,
    private readonly timerScheduler: TimerScheduler,
  ) {}

  deleteEmptyRoom(roomId: string): void {
    const room = this.roomRepository.findById(roomId);
    if (!room || !room.isEmpty()) {
      return;
    }

    this.timerScheduler.cancel(TimerKey.session(roomId));
    this.inviteCodeRepository.deleteByRoomId(roomId);
    this.roomRepository.delete(roomId);
  }
}
