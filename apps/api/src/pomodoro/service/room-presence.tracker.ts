import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { TimerKey } from '../scheduler/timer.scheduler';
import { LeaveRoomService } from './leave-room.service';
import { SSE_RETRY_MS } from './sse.service';

const GRACE_PERIOD_MS = SSE_RETRY_MS * 2;

export interface PresenceConnection {
  connectionId: number;
  // 이 방에 처음 연결했는지. 유예 중 재연결은 첫 연결이 아니다
  isFirstConnection: boolean;
}

@Injectable()
export class RoomPresenceTracker implements OnModuleDestroy {
  // 키는 모두 TimerKey.presence(roomId, participantId). 방마다 따로 센다
  private readonly graceTimers = new Map<string, NodeJS.Timeout>();
  // 연결 수 대신 연결 ID를 적는다. 기록을 지운 뒤 늦게 온 옛 연결의 종료를 구분하기 위해서다
  private readonly connectionIds = new Map<string, Set<number>>();
  private lastConnectionId = 0;

  constructor(private readonly leaveRoomService: LeaveRoomService) {}

  registerPendingParticipant(roomId: string, participantId: string): void {
    this.startGraceTimer(roomId, participantId);
  }

  connectParticipant(
    roomId: string,
    participantId: string,
  ): PresenceConnection {
    const key = TimerKey.presence(roomId, participantId);
    const ids = this.connectionIds.get(key) ?? new Set<number>();
    const isFirstConnection = !this.connectionIds.has(key);
    const connectionId = ++this.lastConnectionId;
    ids.add(connectionId);
    this.connectionIds.set(key, ids);
    this.cancelGraceTimer(key);
    return { connectionId, isFirstConnection };
  }

  disconnectParticipant(
    roomId: string,
    participantId: string,
    connectionId: number,
  ): void {
    const key = TimerKey.presence(roomId, participantId);
    const ids = this.connectionIds.get(key);
    // 바로 퇴장으로 기록이 지워진 뒤 늦게 끊긴 옛 연결이면 무시한다
    if (!ids?.delete(connectionId)) {
      return;
    }
    if (ids.size === 0) {
      this.startGraceTimer(roomId, participantId);
    }
  }

  onModuleDestroy(): void {
    this.graceTimers.forEach((timer) => clearTimeout(timer));
    this.graceTimers.clear();
  }

  private startGraceTimer(roomId: string, participantId: string): void {
    const key = TimerKey.presence(roomId, participantId);
    this.cancelGraceTimer(key);
    this.graceTimers.set(
      key,
      setTimeout(() => this.expire(roomId, participantId), GRACE_PERIOD_MS),
    );
  }

  private cancelGraceTimer(key: string): void {
    clearTimeout(this.graceTimers.get(key));
    this.graceTimers.delete(key);
  }

  private expire(roomId: string, participantId: string): void {
    const key = TimerKey.presence(roomId, participantId);
    this.graceTimers.delete(key);
    this.connectionIds.delete(key);
    this.leaveRoomService.leaveRoom(roomId, participantId);
  }
}
