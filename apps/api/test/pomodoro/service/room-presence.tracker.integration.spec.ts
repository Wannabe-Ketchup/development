import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemClock } from '../../../src/common/clock/system.clock';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import type { Room as RoomState } from '@pomodoro/shared';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/room-presence.tracker';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';

const GRACE_PERIOD_MS = 10000;

function restoreRoom(roomId: string, participantIds: string[]): Room {
  return Room.restore({
    roomId,
    participants: participantIds.map((id) =>
      Participant.restore({
        id,
        nickname: id,
        statusMessage: '',
        completedCycles: 0,
        joinedAt: '2026-11-26T00:00:00.000Z',
      }),
    ),
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

function createTracker(roomRepository: InMemoryRoomRepository) {
  return new RoomPresenceTracker(
    new LeaveRoomService(
      roomRepository,
      new SseService(),
      new InMemoryTimerScheduler(new EventEmitter2()),
      new SystemClock(),
    ),
  );
}

describe('RoomPresenceTracker', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('registerPendingParticipant', () => {
    it('입장 후 10초 안에 접속하지 않은 참가자는 방에서 나가고 같은 방에 room_state가 전파된다 (ENTER-04, LEAVE-02)', () => {
      // given
      jest.useFakeTimers();
      const roomId = 'roomId';
      const ghostId = 'A';
      const joinedAt = '2026-09-02T00:00:00.000Z';
      const roomRepository = new InMemoryRoomRepository();
      const sseService = new SseService();
      const tracker = new RoomPresenceTracker(
        new LeaveRoomService(
          roomRepository,
          sseService,
          new InMemoryTimerScheduler(new EventEmitter2()),
          new SystemClock(),
        ),
      );
      const room = Room.create(roomId);
      room.join(Participant.create(ghostId, '케첩', joinedAt));
      room.join(Participant.create('B', '머스타드', joinedAt));
      roomRepository.save(room);
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      tracker.registerPendingParticipant(roomId, ghostId);
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 1;
      const expectedRemainingIds = ['B'];
      expect(roomRepository.findById(roomId)?.participants.has(ghostId)).toBe(
        false,
      );
      expect(publishedStates).toHaveLength(expectedPublishCount);
      expect(publishedStates[0].participants.map((p) => p.id)).toEqual(
        expectedRemainingIds,
      );
    });
  });

  describe('연결과 유예 타이머는 방마다 따로 센다', () => {
    it('이전 방의 연결이 끊긴 뒤 유예 안에 다른 방에 입장해도 10초 뒤 이전 방에서 퇴장된다', () => {
      // given
      jest.useFakeTimers();
      const roomRepository = new InMemoryRoomRepository();
      roomRepository.save(restoreRoom('room-a', ['P', 'Q']));
      roomRepository.save(restoreRoom('room-b', ['P']));
      const tracker = createTracker(roomRepository);
      const { connectionId } = tracker.connectParticipant('room-a', 'P');
      tracker.disconnectParticipant('room-a', 'P', connectionId);

      // when
      tracker.registerPendingParticipant('room-b', 'P');
      jest.advanceTimersByTime(GRACE_PERIOD_MS);

      // then
      expect(roomRepository.findById('room-a')?.participants.has('P')).toBe(
        false,
      );
    });

    it('다른 방에 연결이 남아 있어도 이 방의 연결이 모두 끊기면 10초 뒤 이 방에서 퇴장된다', () => {
      // given
      jest.useFakeTimers();
      const roomRepository = new InMemoryRoomRepository();
      roomRepository.save(restoreRoom('room-a', ['P', 'Q']));
      roomRepository.save(restoreRoom('room-b', ['P']));
      const tracker = createTracker(roomRepository);
      const { connectionId } = tracker.connectParticipant('room-a', 'P');
      tracker.connectParticipant('room-b', 'P');

      // when
      tracker.disconnectParticipant('room-a', 'P', connectionId);
      jest.advanceTimersByTime(GRACE_PERIOD_MS);

      // then
      expect(roomRepository.findById('room-a')?.participants.has('P')).toBe(
        false,
      );
    });

    it('다른 방에 연결한 적이 있어도 이 방에 처음 연결하면 첫 연결로 센다', () => {
      // given
      const tracker = createTracker(new InMemoryRoomRepository());
      tracker.connectParticipant('room-a', 'P');

      // when
      const connection = tracker.connectParticipant('room-b', 'P');

      // then
      expect(connection.isFirstConnection).toBe(true);
    });
  });
});
