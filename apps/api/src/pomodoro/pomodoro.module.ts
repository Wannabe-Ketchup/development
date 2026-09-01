import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { TimerService } from './service/timer.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';

@Module({
  controllers: [PomodoroController],
  providers: [
    TimerService,
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
  ],
})
export class PomodoroModule {}
