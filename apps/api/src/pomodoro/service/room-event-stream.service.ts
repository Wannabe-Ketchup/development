import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, merge, of } from 'rxjs';
import type { SseEventPayload } from '@pomodoro/shared';
import { SseService } from './sse.service';
import { RoomPresenceService } from './room-presence.service';
import { RoomQueryService } from './room-query.service';

@Injectable()
export class RoomEventStreamService {
  constructor(
    private readonly sseService: SseService,
    private readonly roomPresenceService: RoomPresenceService,
    private readonly roomQueryService: RoomQueryService,
  ) {}

  streamEvents(
    roomId: string,
    participantId: string,
  ): Observable<MessageEvent> {
    const room = this.roomQueryService.findExistingRoom(roomId);
    const roomStateEvent: SseEventPayload = {
      type: 'room_state',
      data: this.roomQueryService.toRoom(room),
    };

    const { isNewlyConfirmed } = this.roomPresenceService.confirmParticipant(
      roomId,
      participantId,
    );

    if (isNewlyConfirmed) {
      this.sseService.emit(roomId, roomStateEvent);
    }

    return merge(
      of(this.sseService.createMessageEvent(roomStateEvent)),
      this.sseService.subscribe(roomId),
    );
  }
}
