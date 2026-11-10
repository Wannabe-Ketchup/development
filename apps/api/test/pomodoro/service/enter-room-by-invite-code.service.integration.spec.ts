import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Registry } from 'prom-client';
import { Clock } from '../../../src/common/clock/clock';
import { SystemClock } from '../../../src/common/clock/system.clock';
import { MetricsService } from '../../../src/metrics/metrics.service';
import { EnterRoomByInviteCodeService } from '../../../src/pomodoro/service/enter-room-by-invite-code.service';
import { EnterRoomService } from '../../../src/pomodoro/service/enter-room.service';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/room-presence.tracker';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { InviteCodeRepository } from '../../../src/pomodoro/repository/invite-code.repository';
import { InMemoryInviteCodeRepository } from '../../../src/pomodoro/repository/in-memory.invite-code.repository';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';
import { TimerScheduler } from '../../../src/pomodoro/scheduler/timer.scheduler';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

function restoreEmptyRoom(roomId: string): Room {
  return Room.restore({
    roomId,
    participants: [],
    capacity: 4,
    timer: Timer.restore({
      status: 'IDLE',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: null,
      remainingTimeSec: FOCUS_DURATION_SECONDS,
    }),
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
  });
}

describe('EnterRoomByInviteCodeService', () => {
  beforeEach(() => {
    // RoomPresenceTracker가 거는 퇴장 대기 타이머가 테스트 뒤에 남지 않게 한다
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('enterRoomByInviteCode', () => {
    it('초대코드로 입장하면 그 코드의 방에 참가자가 저장된다', async () => {
      // given
      const moduleRef = await Test.createTestingModule({
        providers: [
          EnterRoomByInviteCodeService,
          EnterRoomService,
          RoomQueryService,
          RoomPresenceTracker,
          LeaveRoomService,
          SseService,
          EventEmitter2,
          MetricsService,
          { provide: Registry, useValue: new Registry() },
          { provide: Clock, useClass: SystemClock },
          { provide: TimerScheduler, useClass: InMemoryTimerScheduler },
          { provide: RoomRepository, useClass: InMemoryRoomRepository },
          {
            provide: InviteCodeRepository,
            useClass: InMemoryInviteCodeRepository,
          },
        ],
      }).compile();
      const roomRepository = moduleRef.get(RoomRepository);
      const inviteCodeRepository = moduleRef.get(InviteCodeRepository);
      const service = moduleRef.get(EnterRoomByInviteCodeService);
      const roomId = 'room-uuid-1';
      const sessionParticipantId = 'session-participant-id';
      roomRepository.save(restoreEmptyRoom(roomId));
      inviteCodeRepository.save(roomId, InviteCode.restore('K7P2QX'));

      // when
      service.enterRoomByInviteCode('K7P2QX', sessionParticipantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.participants.has(sessionParticipantId)).toBe(true);
    });
  });
});
