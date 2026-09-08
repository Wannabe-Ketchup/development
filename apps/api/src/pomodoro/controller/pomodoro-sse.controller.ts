import { Controller, Param, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from '../service/sse.service';

@Controller('sse/pomodoro')
export class PomodoroSseController {
  constructor(private readonly sseService: SseService) {}

  @Sse(':roomId')
  streamEvents(@Param('roomId') roomId: string): Observable<MessageEvent> {
    return this.sseService.subscribe(roomId);
  }
}
