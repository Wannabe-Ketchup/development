import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { LeaveRoomService } from './leave-room.service';
import { SSE_RETRY_MS } from './sse.service';

const GRACE_PERIOD_MS = SSE_RETRY_MS * 2;

@Injectable()
export class RoomPresenceTracker implements OnModuleDestroy {
  private readonly graceTimers = new Map<string, NodeJS.Timeout>();
  private readonly connectionCounts = new Map<string, number>();

  constructor(private readonly leaveRoomService: LeaveRoomService) {}

  registerPendingParticipant(roomId: string, participantId: string): void {
    this.startGraceTimer(roomId, participantId);
  }

  connectParticipant(participantId: string): boolean {
    const isFirstConnection = !this.connectionCounts.has(participantId);
    this.connectionCounts.set(
      participantId,
      (this.connectionCounts.get(participantId) ?? 0) + 1,
    );
    this.cancelGraceTimer(participantId);
    return isFirstConnection;
  }

  disconnectParticipant(roomId: string, participantId: string): void {
    const remaining = (this.connectionCounts.get(participantId) ?? 1) - 1;
    this.connectionCounts.set(participantId, remaining);
    if (remaining === 0) {
      this.startGraceTimer(roomId, participantId);
    }
  }

  onModuleDestroy(): void {
    this.graceTimers.forEach((timer) => clearTimeout(timer));
    this.graceTimers.clear();
  }

  private startGraceTimer(roomId: string, participantId: string): void {
    this.cancelGraceTimer(participantId);
    this.graceTimers.set(
      participantId,
      setTimeout(() => this.expire(roomId, participantId), GRACE_PERIOD_MS),
    );
  }

  private cancelGraceTimer(participantId: string): void {
    clearTimeout(this.graceTimers.get(participantId));
    this.graceTimers.delete(participantId);
  }

  private expire(roomId: string, participantId: string): void {
    this.graceTimers.delete(participantId);
    this.connectionCounts.delete(participantId);
    this.leaveRoomService.leaveRoom(roomId, participantId);
  }
}
