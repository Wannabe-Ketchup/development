import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TimerService } from '../service/timer.service';
import { EnterRoomService } from '../service/enter-room.service';
import { ChangeNicknameService } from '../service/change-nickname.service';
import type { JoinRoomResponse } from '../dto/join-room-response.dto';
import type { ChangeNicknameRequest } from '../dto/change-nickname-request.dto';
import { CreateRoomService } from '../service/create-room.service';
import type { CreateRoomResponse } from '@pomodoro/shared';

@Controller('pomodoro')
export class PomodoroController {
  constructor(
    private readonly timerService: TimerService,
    private readonly enterRoomService: EnterRoomService,
    private readonly changeNicknameService: ChangeNicknameService,
    private readonly createRoomService: CreateRoomService,
  ) {}

  @Post('room/:roomId/participant')
  enterRoom(
    @Param('roomId') roomId: string,
    @Body('participantId') participantId?: string,
  ): JoinRoomResponse {
    return this.enterRoomService.joinRoom(roomId, participantId);
  }

  @Patch('room/:roomId/participant/:participantId/nickname')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeNickname(
    @Param('roomId') roomId: string,
    @Param('participantId') participantId: string,
    @Body() body: ChangeNicknameRequest,
  ): void {
    this.changeNicknameService.changeNickname(
      roomId,
      participantId,
      body.nickname,
    );
  }

  @Post('room')
  createRoom(): CreateRoomResponse {
    return { roomId: this.createRoomService.create() };
  }
}
