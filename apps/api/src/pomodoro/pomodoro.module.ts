import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { PomodoroSseController } from './controller/pomodoro-sse.controller';
import { SseService } from './service/sse.service';
import { TimerService } from './service/timer.service';
import { EnterRoomService } from './service/enter-room.service';
import { RoomQueryService } from './service/room-query.service';
import { RoomPresenceService } from './service/room-presence.service';
import { RoomEventStreamService } from './service/room-event-stream.service';
import { CreateParticipantService } from './service/create-participant.service';
import { RoomRepository } from './repository/room.repository';
import { InMemoryRoomRepository } from './repository/in-memory.room.repository';
import { Room } from './domain/room.entity';

// TODO: 방 생성 기능이 실제로 만들어지면 이 개발용 시드는 제거한다.
const DEV_SEED_ROOM_ID = '00000000-0000-4000-8000-000000000001';

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
    { provide: RoomRepository, useClass: InMemoryRoomRepository },
  ],
  exports: [SseService],
})
export class PomodoroModule implements OnModuleInit {
  private readonly logger = new Logger(PomodoroModule.name);

  constructor(private readonly roomRepository: RoomRepository) {}

  onModuleInit(): void {
    this.roomRepository.save(Room.create(DEV_SEED_ROOM_ID));
    this.logger.log(
      `[DEV] 테스트용 방을 생성했습니다: roomId=${DEV_SEED_ROOM_ID}`,
    );
  }
}
