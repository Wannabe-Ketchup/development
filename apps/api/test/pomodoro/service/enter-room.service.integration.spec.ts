import { Test } from '@nestjs/testing';
import { EnterRoomService } from '../../../src/pomodoro/service/enter-room.service';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { RoomPresenceService } from '../../../src/pomodoro/service/room-presence.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';

describe('EnterRoomService', () => {
  beforeEach(() => {
    // RoomPresenceService가 거는 퇴장 대기 타이머가 테스트 뒤에 남지 않게 한다
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
          RoomPresenceService,
          { provide: RoomRepository, useClass: InMemoryRoomRepository },
        ],
      }).compile();
      const roomRepository = moduleRef.get(RoomRepository);
      const service = moduleRef.get(EnterRoomService);
      const roomId = 'roomId';
      const sessionParticipantId = 'session-participant-id';
      roomRepository.save(Room.create(roomId));

      // when
      service.joinRoom(roomId, sessionParticipantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.participants.has(sessionParticipantId)).toBe(true);
    });
  });
});
