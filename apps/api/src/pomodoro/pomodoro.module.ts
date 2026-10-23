import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { PomodoroSseController } from './controller/pomodoro-sse.controller';
import { SseService } from './service/sse.service';
import { TimerService } from './service/timer.service';
import { EnterRoomService } from './service/enter-room.service';
import { RoomQueryService } from './service/room-query.service';
import { RoomPresenceService } from './service/room-presence.service';
import { RoomEventStreamService } from './service/room-event-stream.service';
import { ChangeNicknameService } from './service/change-nickname.service';
import { ChangeStatusMessageService } from './service/change-status-message.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';
import { TimerScheduler } from './scheduler/timer.scheduler';
import { InMemoryTimerScheduler } from './scheduler/in-memory.timer.scheduler';
import { CreateRoomService } from './service/create-room.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [PomodoroController, PomodoroSseController],
  providers: [
    SseService,
    TimerService,
    EnterRoomService,
    RoomQueryService,
    RoomPresenceService,
    RoomEventStreamService,
    ChangeNicknameService,
    CreateRoomService,
    ChangeStatusMessageService,
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
    { provide: TimerScheduler, useClass: InMemoryTimerScheduler },
  ],
  exports: [SseService],
})
export class PomodoroModule {}
