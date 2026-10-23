import { Controller, Param, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ParticipantId } from '../../auth/decorator/participant-id.decorator';
import { RoomEventStreamService } from '../service/room-event-stream.service';
import { MetricsService } from '../../metrics/metrics.service';

@Controller('sse/pomodoro')
export class PomodoroSseController {
  constructor(
    private readonly roomEventStreamService: RoomEventStreamService,
    private readonly metricsService: MetricsService,
  ) {}

  @Sse(':roomId')
  streamEvents(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): Observable<MessageEvent> {
    return this.metricsService.trackSseStream(
      this.roomEventStreamService.streamEvents(roomId, participantId),
    );
  }
}
