import { Controller, Param, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ParticipantId } from '../../auth/decorator/participant-id.decorator';
import { RoomEventStreamService } from '../service/room-event-stream.service';

@Controller('sse/pomodoro')
export class PomodoroSseController {
  constructor(
    private readonly roomEventStreamService: RoomEventStreamService,
  ) {}

  @Sse(':roomId')
  streamEvents(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): Observable<MessageEvent> {
    return this.roomEventStreamService.streamEvents(roomId, participantId);
  }
}
