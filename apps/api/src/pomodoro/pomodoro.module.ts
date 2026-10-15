import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { PomodoroSseController } from './controller/pomodoro-sse.controller';
import { SseService } from './service/sse.service';
import { TimerService } from './service/timer.service';
import { EnterRoomService } from './service/enter-room.service';
import { RoomQueryService } from './service/room-query.service';
import { RoomPresenceService } from './service/room-presence.service';
import { RoomEventStreamService } from './service/room-event-stream.service';
import { CreateParticipantService } from './service/create-participant.service';
import { ChangeNicknameService } from './service/change-nickname.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';
import { CreateRoomService } from './service/create-room.service';

@Module({
  controllers: [PomodoroController, PomodoroSseController],
  providers: [
    SseService,
    TimerService,
    EnterRoomService,
    RoomQueryService,
    RoomPresenceService,
    RoomEventStreamService,
    CreateParticipantService,
    ChangeNicknameService,
    CreateRoomService,
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
  ],
  exports: [SseService],
})
export class PomodoroModule {}
