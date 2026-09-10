import { RoomPresenceService } from './room-presence.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';

describe('RoomPresenceService', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';

  let leave: jest.Mock;
  let room: Room;

  let findById: jest.Mock;
  let save: jest.Mock;
  let roomRepository: RoomRepository;

  let service: RoomPresenceService;

  beforeEach(() => {
    jest.useFakeTimers();

    leave = jest.fn();
    room = { leave } as unknown as Room;

    findById = jest.fn().mockReturnValue(room);
    save = jest.fn();
    roomRepository = { findById, save, delete: jest.fn() };

    service = new RoomPresenceService(roomRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('registerPendingParticipant', () => {
    it('등록 후 확정 없이 5초가 지나면 해당 참가자를 방에서 퇴장시키고 저장한다', () => {
      // given
      service.registerPendingParticipant(roomId, participantId);

      // when
      jest.advanceTimersByTime(5000);

      // then
      expect(leave).toHaveBeenCalledWith(participantId);
      expect(save).toHaveBeenCalledWith(room);
    });

    it('5초 이내에 확정되면 해당 참가자를 퇴장시키지 않는다', () => {
      // given
      service.registerPendingParticipant(roomId, participantId);
      service.confirmParticipant(roomId, participantId);

      // when
      jest.advanceTimersByTime(5000);

      // then
      expect(leave).not.toHaveBeenCalled();
    });
  });

  describe('confirmParticipant', () => {
    it('방금 대기 등록된 참가자가 처음 확정되면 다른 참가자에게 브로드캐스트해야 한다고 판단한다', () => {
      // given
      service.registerPendingParticipant(roomId, participantId);

      // when
      const result = service.confirmParticipant(roomId, participantId);

      // then
      expect(result).toEqual({ isNewlyConfirmed: true });
    });

    it('새로고침으로 재입장한 기존 참가자(퇴장 타이머가 등록된 적 없음)는 SSE가 연결돼도 브로드캐스트되지 않는다', () => {
      // given
      // participantId 재사용으로 입장해 registerPendingParticipant가 호출된 적 없는 상황(이미 방에 있던 사람)

      // when
      const result = service.confirmParticipant(roomId, participantId);

      // then
      expect(result).toEqual({ isNewlyConfirmed: false });
    });

    it('네트워크가 잠깐 끊겼다 재연결된 기존 참가자(이미 확정됐던 사람)는 다시 브로드캐스트되지 않는다', () => {
      // given
      service.registerPendingParticipant(roomId, participantId);
      service.confirmParticipant(roomId, participantId);

      // when
      const result = service.confirmParticipant(roomId, participantId);

      // then
      expect(result).toEqual({ isNewlyConfirmed: false });
    });
  });
});
