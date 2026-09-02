import { NotFoundException } from '@nestjs/common';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';
import { Timer } from '../domain/timer.entity';

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
    // Given
    const room = new Room(
      roomId,
      new Map(),
      new Timer('IDLE', 1500, 300, 4, null, 1500),
      'IDLE',
      0,
    );
    findById.mockReturnValue(room);

    // When
    const result = service.findExistingRoom(roomId);

    // Then
    expect(result).toBe(room);
  });

  it('존재하지 않는 방을 조회하면 입장을 거부한다', () => {
    // Given
    findById.mockReturnValue(undefined);

    // When / Then
    expect(() => service.findExistingRoom(roomId)).toThrow(NotFoundException);
  });
});
