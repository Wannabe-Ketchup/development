import { NotFoundException } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';
import { Participant } from '../domain/participant.entity';

describe('RoomQueryService.findExistingRoom', () => {
  const roomId = 'room-1';

  let findById: jest.Mock;
  let roomRepository: RoomRepository;
  let service: RoomQueryService;

  beforeEach(() => {
    findById = jest.fn();
    roomRepository = { findById, save: jest.fn(), delete: jest.fn() };
    service = new RoomQueryService(roomRepository);
  });

  it('존재하는 방을 조회하면 해당 방을 반환한다', () => {
    // given
    const room = {} as unknown as Room;
    findById.mockReturnValue(room);

    // when
    const result = service.findExistingRoom(roomId);

    // then
    expect(result).toBe(room);
  });

  it('존재하지 않는 방을 조회하면 입장을 거부한다', () => {
    // given
    findById.mockReturnValue(undefined);

    // when / Then
    expect(() => service.findExistingRoom(roomId)).toThrow(NotFoundException);
  });
});

describe('RoomQueryService.toRoom', () => {
  let service: RoomQueryService;

  beforeEach(() => {
    const roomRepository: RoomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    service = new RoomQueryService(roomRepository);
  });

  it('방 도메인을 공유 타입 스냅샷으로 변환하면 참가자 목록이 배열로 변환된다', () => {
    // given
    const participant1 = { id: '1', nickname: 'a' } as unknown as Participant;
    const participant2 = { id: '2', nickname: 'b' } as unknown as Participant;
    const room = {
      roomId: 'room-1',
      mode: ROOM_MODE.FOCUS,
      currentCycle: 2,
      timer: { status: 'RUNNING' },
      participants: new Map([
        [participant1.id, participant1],
        [participant2.id, participant2],
      ]),
    } as unknown as Room;

    // when
    const result = service.toRoom(room);

    // then
    expect(result).toEqual({
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [participant1, participant2],
    });
  });
});
