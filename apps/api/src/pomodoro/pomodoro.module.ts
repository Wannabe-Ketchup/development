import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { PomodoroSseController } from './controller/pomodoro-sse.controller';
import { SseService } from './service/sse.service';
import { TimerService } from './service/timer.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';

@Module({
  controllers: [PomodoroController, PomodoroSseController],
  providers: [
    SseService,
    TimerService,
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
  ],
  exports: [SseService],
})
export class PomodoroModule {}
