import { NotFoundException } from '@nestjs/common';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';

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
