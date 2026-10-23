import type { Room as RoomState } from '@pomodoro/shared';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/room-presence.tracker';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';

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
        new LeaveRoomService(roomRepository, sseService),
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
});
