import { Controller, Param, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomEventStreamService } from '../service/room-event-stream.service';

@Controller('sse/pomodoro')
export class PomodoroSseController {
  constructor(
    private readonly roomEventStreamService: RoomEventStreamService,
  ) {}

  @Sse(':roomId')
  streamEvents(
    @Param('roomId') roomId: string,
    @Query('participantId') participantId: string,
  ): Observable<MessageEvent> {
    return this.roomEventStreamService.streamEvents(roomId, participantId);
  }
}
