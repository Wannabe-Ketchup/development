import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ParticipantId } from '../../auth/decorator/participant-id.decorator';
import { EnterRoomService } from '../service/enter-room.service';
import { ChangeNicknameService } from '../service/change-nickname.service';
import { ChangeStatusMessageService } from '../service/change-status-message.service';
import { StartPomodoroService } from '../service/start-pomodoro.service';
import { PausePomodoroService } from '../service/pause-pomodoro.service';
import { ResumePomodoroService } from '../service/resume-pomodoro.service';
import type { JoinRoomResponse } from '../dto/join-room-response.dto';
import type { ChangeNicknameRequest } from '../dto/change-nickname-request.dto';
import { CreateRoomService } from '../service/create-room.service';
import { RoomQueryService } from '../service/room-query.service';
import { FindInviteCodeService } from '../service/find-invite-code.service';
import { EnterRoomByInviteCodeService } from '../service/enter-room-by-invite-code.service';
import type { EnterRoomByInviteCodeRequest } from '../dto/enter-room-by-invite-code-request.dto';
import { InviteCodeResponse } from '../dto/invite-code-response.dto';
import type { CreateRoomResponse, ExistsRoomResponse } from '@pomodoro/shared';
import type { ChangeStatusMessageRequest } from '../dto/change-status-message-request.dto';
import { NotifyDiscord } from '../../common/notification/notify-discord.decorator';

@Controller('pomodoro')
export class PomodoroController {
  constructor(
    private readonly enterRoomService: EnterRoomService,
    private readonly changeNicknameService: ChangeNicknameService,
    private readonly createRoomService: CreateRoomService,
    private readonly roomQueryService: RoomQueryService,
    private readonly changeStatusMessageService: ChangeStatusMessageService,
    private readonly startPomodoroService: StartPomodoroService,
    private readonly pausePomodoroService: PausePomodoroService,
    private readonly resumePomodoroService: ResumePomodoroService,
    private readonly findInviteCodeService: FindInviteCodeService,
    private readonly enterRoomByInviteCodeService: EnterRoomByInviteCodeService,
  ) {}

  @Get('room/:roomId/exists')
  existsRoom(@Param('roomId') roomId: string): ExistsRoomResponse {
    return { exists: this.roomQueryService.exists(roomId) };
  }

  @Get('room/:roomId/invite-code')
  findInviteCode(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): InviteCodeResponse {
    return InviteCodeResponse.from(
      this.findInviteCodeService.findInviteCode(roomId, participantId),
    );
  }

  @Post('room/:roomId/participant')
  enterRoom(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): JoinRoomResponse {
    return this.enterRoomService.joinRoom(roomId, participantId);
  }

  @Post('room/participant/invite-code')
  enterRoomByInviteCode(
    @Body() body: EnterRoomByInviteCodeRequest,
    @ParticipantId() participantId: string,
  ): JoinRoomResponse {
    return this.enterRoomByInviteCodeService.enterRoomByInviteCode(
      body.inviteCode,
      participantId,
    );
  }

  @Patch('room/:roomId/participant/nickname')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeNickname(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
    @Body() body: ChangeNicknameRequest,
  ): void {
    this.changeNicknameService.changeNickname(
      roomId,
      participantId,
      body.nickname,
    );
  }

  @Post('room')
  @NotifyDiscord<CreateRoomResponse>({
    title: '새 뽀모도로 방을 만들었어요!',
    fields: (response) => [{ name: '방 ID', value: response.roomId }],
  })
  createRoom(): CreateRoomResponse {
    return { roomId: this.createRoomService.create() };
  }

  @Patch('room/:roomId/participant/status-message')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeStatusMessage(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
    @Body() body: ChangeStatusMessageRequest,
  ): void {
    this.changeStatusMessageService.changeStatusMessage(
      roomId,
      participantId,
      body.statusMessage,
    );
  }

  @Post('room/:roomId/participant/pomodoro-start')
  @HttpCode(HttpStatus.NO_CONTENT)
  startPomodoro(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): void {
    this.startPomodoroService.startPomodoro(roomId, participantId);
  }

  @Post('room/:roomId/participant/pomodoro-pause')
  @HttpCode(HttpStatus.NO_CONTENT)
  pausePomodoro(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): void {
    this.pausePomodoroService.pausePomodoro(roomId, participantId);
  }

  @Post('room/:roomId/participant/pomodoro-resume')
  @HttpCode(HttpStatus.NO_CONTENT)
  resumePomodoro(
    @Param('roomId') roomId: string,
    @ParticipantId() participantId: string,
  ): void {
    this.resumePomodoroService.resumePomodoro(roomId, participantId);
  }
}
