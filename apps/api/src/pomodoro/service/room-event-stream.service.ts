import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, defer, finalize, merge, of } from 'rxjs';
import type { SseEventPayload } from '@pomodoro/shared';
import { SseService } from './sse.service';
import { RoomPresenceTracker } from './room-presence.tracker';
import { RoomQueryService } from './room-query.service';
import { RoomDto } from '../dto/room.dto';

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

      if (this.roomPresenceTracker.connectParticipant(participantId)) {
        this.sseService.emit(roomId, roomStateEvent);
      }

      return merge(
        of(this.sseService.createOwnSnapshotEvent(roomStateEvent)),
        this.sseService.subscribe(roomId),
      );
    }).pipe(
      finalize(() =>
        this.roomPresenceTracker.disconnectParticipant(roomId, participantId),
      ),
    );
  }
}
