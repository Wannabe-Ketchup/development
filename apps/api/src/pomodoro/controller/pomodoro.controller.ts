import { Controller, Param, Post } from '@nestjs/common';
import { TimerService } from '../service/timer.service';
import { EnterRoomService } from '../service/enter-room.service';
import type { JoinRoomResponse } from '../dto/join-room-response.dto';

@Controller('pomodoro')
export class PomodoroController {
  constructor(
    private readonly timerService: TimerService,
    private readonly enterRoomService: EnterRoomService,
  ) {}

  @Post('room/:roomId/participant')
  enterRoom(@Param('roomId') roomId: string): JoinRoomResponse {
    return this.enterRoomService.joinRoom(roomId);
  }
}
