import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';

const EXIT_GRACE_PERIOD_MS = 5000;

@Injectable()
export class RoomPresenceService {
  private readonly pendingTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly roomRepository: RoomRepository) {}

  registerPendingParticipant(roomId: string, participantId: string): void {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(participantId);

      const room = this.roomRepository.findById(roomId);
      if (!room) {
        return;
      }

      room.leave(participantId);
      this.roomRepository.save(room);
    }, EXIT_GRACE_PERIOD_MS);

    this.pendingTimers.set(participantId, timer);
  }

  confirmParticipant(roomId: string, participantId: string): boolean {
    const timer = this.pendingTimers.get(participantId);
    if (!timer) {
      return false;
    }

    clearTimeout(timer);
    this.pendingTimers.delete(participantId);
    return true;
  }
}
