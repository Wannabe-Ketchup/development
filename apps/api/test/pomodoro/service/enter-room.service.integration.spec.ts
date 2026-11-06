import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
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
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { TIMER_EVENT } from '../../../src/pomodoro/constant/timer-event.constant';
import { EMPTY_ROOM_DELETION_DELAY_SEC } from '../../../src/pomodoro/constant/room-deletion.constant';
import { TimerKey } from '../../../src/pomodoro/scheduler/timer.scheduler';

const MS_PER_SECOND = 1000;

describe('EnterRoomService', () => {
  beforeEach(() => {
    // RoomPresenceTracker가 거는 퇴장 대기 타이머가 테스트 뒤에 남지 않게 한다
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('joinRoom', () => {
    it('로그인 세션으로 방에 입장하면 그 세션의 participantId를 ID로 가진 참가자가 방에 저장된다', async () => {
      // given
      const moduleRef = await Test.createTestingModule({
        providers: [
          EnterRoomService,
          RoomQueryService,
          RoomPresenceTracker,
          LeaveRoomService,
          SseService,
          EventEmitter2,
          { provide: TimerScheduler, useClass: InMemoryTimerScheduler },
          { provide: RoomRepository, useClass: InMemoryRoomRepository },
          {
            provide: InviteCodeRepository,
            useClass: InMemoryInviteCodeRepository,
          },
        ],
      }).compile();
      const roomRepository = moduleRef.get(RoomRepository);
      const service = moduleRef.get(EnterRoomService);
      const roomId = 'room-uuid-1';
      const sessionParticipantId = 'session-participant-id';
      roomRepository.save(Room.create(roomId));

      // when
      service.joinRoom(roomId, sessionParticipantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.participants.has(sessionParticipantId)).toBe(true);
    });

    it('초대코드로 입장하면 그 코드의 방에 참가자가 저장된다', async () => {
      // given
      const moduleRef = await Test.createTestingModule({
        providers: [
          EnterRoomService,
          RoomQueryService,
          RoomPresenceTracker,
          LeaveRoomService,
          SseService,
          EventEmitter2,
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
      const service = moduleRef.get(EnterRoomService);
      const roomId = 'room-uuid-1';
      const sessionParticipantId = 'session-participant-id';
      roomRepository.save(Room.create(roomId));
      inviteCodeRepository.save(roomId, InviteCode.restore('K7P2QX'));

      // when
      service.joinRoom('K7P2QX', sessionParticipantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.participants.has(sessionParticipantId)).toBe(true);
    });

    it('비어 있던 방에 입장하면 삭제 예약이 취소되어 30분이 지나도 삭제되지 않는다', async () => {
      // given: 비어서 삭제 예약이 걸린 방
      const moduleRef = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot(), PomodoroModule],
      }).compile();
      await moduleRef.init();
      const roomRepository = moduleRef.get(RoomRepository);
      const roomId = 'room-uuid-1';
      const participantId = 'session-participant-id';
      roomRepository.save(
        Room.restore({
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
        }),
      );
      moduleRef
        .get(TimerScheduler)
        .register(
          TimerKey.roomDeletion(roomId),
          TIMER_EVENT.ROOM_DELETION_TIMEOUT,
          { roomId },
          EMPTY_ROOM_DELETION_DELAY_SEC,
        );

      // when: 입장하고 연결을 유지한다
      moduleRef.get(EnterRoomService).joinRoom(roomId, participantId);
      moduleRef.get(RoomPresenceTracker).connectParticipant(participantId);

      // then: 예약된 타이머가 하나도 남지 않고, 30분이 지나도 방이 남는다
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(EMPTY_ROOM_DELETION_DELAY_SEC * MS_PER_SECOND);
      expect(roomRepository.findById(roomId)).toBeDefined();

      await moduleRef.close();
    });
  });
});
