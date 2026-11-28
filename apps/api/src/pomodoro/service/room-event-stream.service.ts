import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, defer, finalize, merge, of } from 'rxjs';
import type { SseEventPayload } from '@pomodoro/shared';
import { SseService } from './sse.service';
import { RoomPresenceTracker } from './room-presence.tracker';
import { RoomQueryService } from './room-query.service';
import { RoomDto } from '../dto/room.dto';
import { ChatHistoryResponse } from '../dto/chat-history-response.dto';

@Injectable()
export class RoomEventStreamService {
  constructor(
    private readonly sseService: SseService,
    private readonly roomPresenceTracker: RoomPresenceTracker,
    private readonly roomQueryService: RoomQueryService,
  ) {}

  streamEvents(
    roomId: string,
    participantId: string,
  ): Observable<MessageEvent> {
    const room = this.roomQueryService.findExistingRoom(roomId);

    if (!room.participants.has(participantId)) {
      throw new NotFoundException('참가자를 찾을 수 없습니다.');
    }

    return defer(() => {
      const roomStateEvent: SseEventPayload = {
        type: 'room_state',
        data: RoomDto.fromEntity(room),
      };

      const connection = this.roomPresenceTracker.connectParticipant(
        roomId,
        participantId,
      );
      if (connection.isFirstConnection) {
        this.sseService.emit(roomId, roomStateEvent);
      }

      const chatHistoryEvent: SseEventPayload = {
        type: 'chat_history',
        data: ChatHistoryResponse.from(
          room.chatMessagesSinceJoined(participantId),
        ),
      };

      // 두 스냅샷과 구독이 한 번에 동기로 이어져, 그 사이에 저장된 메시지를 놓치거나 두 번 받지 않는다
      // finalize가 connection을 읽을 수 있게 defer 안쪽 Observable에 붙인다
      return merge(
        of(
          this.sseService.createOwnSnapshotEvent(roomStateEvent),
          this.sseService.createOwnSnapshotEvent(chatHistoryEvent),
        ),
        this.sseService.subscribe(roomId),
        this.sseService.heartbeats(),
      ).pipe(
        finalize(() =>
          this.roomPresenceTracker.disconnectParticipant(
            roomId,
            participantId,
            connection.connectionId,
          ),
        ),
      );
    });
  }
}
