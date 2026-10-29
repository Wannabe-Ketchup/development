import type { Room as RoomState } from '@pomodoro/shared';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';
import { RoomEventStreamService } from '../../../src/pomodoro/service/room-event-stream.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/room-presence.tracker';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';

describe('RoomEventStreamService', () => {
  const roomId = 'roomId';
  const participantId = 'A';
  const joinedAt = '2026-09-02T00:00:00.000Z';

  const setUp = () => {
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new RoomEventStreamService(
      sseService,
      new RoomPresenceTracker(new LeaveRoomService(roomRepository, sseService)),
      new RoomQueryService(roomRepository),
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    return { roomRepository, sseService, service };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('streamEvents', () => {
    it('접속이 끊기고 10초가 지나면 참가자가 방에서 나가고 같은 방에 room_state가 1번 전파된다 (LEAVE-01, LEAVE-02)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const connection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      connection.unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 1;
      const expectedRemainingIds = ['B'];
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(false);
      expect(publishedStates).toHaveLength(expectedPublishCount);
      expect(publishedStates[0].participants.map((p) => p.id)).toEqual(
        expectedRemainingIds,
      );
    });

    it('접속이 끊긴 뒤 10초 안에 다시 접속하면 참가자는 방에 남고 room_state는 전파되지 않는다 (LEAVE-01)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const firstConnection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      firstConnection.unsubscribe();
      jest.advanceTimersByTime(5000);
      service.streamEvents(roomId, participantId).subscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 0;
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(true);
      expect(publishedStates).toHaveLength(expectedPublishCount);
    });

    it('유예 중 다시 접속했다가 또 끊기면 마지막으로 끊긴 때부터 10초 뒤에 room_state가 1번만 전파된다 (LEAVE-01, LEAVE-02)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const firstConnection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      firstConnection.unsubscribe();
      jest.advanceTimersByTime(5000);
      service.streamEvents(roomId, participantId).subscribe().unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 1;
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(false);
      expect(publishedStates).toHaveLength(expectedPublishCount);
    });

    it('같은 참가자의 탭 두 개 중 하나만 닫히면 10초가 지나도 방에 남는다 (LEAVE-01)', () => {
      // given
      const { roomRepository, service } = setUp();
      const firstTab = service.streamEvents(roomId, participantId).subscribe();
      service.streamEvents(roomId, participantId).subscribe();

      // when
      firstTab.unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(true);
    });
  });
});
