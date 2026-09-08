import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { TimerService } from './service/timer.service';
import { EnterRoomService } from './service/enter-room.service';
import { RoomQueryService } from './service/room-query.service';
import { CreateParticipantService } from './service/create-participant.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';

@Module({
  controllers: [PomodoroController],
  providers: [
    TimerService,
    EnterRoomService,
    RoomQueryService,
    CreateParticipantService,
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
  ],
})
export class PomodoroModule {}
