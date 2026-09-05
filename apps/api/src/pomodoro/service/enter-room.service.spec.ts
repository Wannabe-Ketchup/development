import { NotFoundException } from '@nestjs/common';
import { EnterRoomService } from './enter-room.service';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';
import { Participant } from '../domain/participant.entity';
import { Timer } from '../domain/timer.entity';
import { CreateParticipantService } from './create-participant.service';

describe('EnterRoomService.joinRoom', () => {
  const roomId = 'room-1';

  const createMockRoom = (roomOverrides: { hasNickname?: jest.Mock } = {}) => {
    const hasNickname =
      roomOverrides.hasNickname ?? jest.fn().mockReturnValue(false);
    const join = jest.fn();

    const room = {
      roomId,
      participants: new Map(),
      mode: 'IDLE',
      currentCycle: 1,
      timer: {},
      hasNickname,
      join,
    } as unknown as Room;

    return { room, hasNickname, join };
  };

  const createMockParticipant = (nickname: string): Participant =>
    ({
      id: 'participant-1',
      nickname,
      statusMessage: '',
      currentCycle: 0,
      joinedAt: '2026-09-02T00:00:00.000Z',
    }) as unknown as Participant;

  let findExistingRoom: jest.Mock;
  let roomQueryService: RoomQueryService;

  let save: jest.Mock;
  let roomRepository: RoomRepository;

  let create: jest.Mock;
  let createParticipantService: CreateParticipantService;

  let generateRandomNickname: jest.SpyInstance;

  let service: EnterRoomService;

  beforeEach(() => {
    jest.clearAllMocks();

    findExistingRoom = jest.fn();
    roomQueryService = { findExistingRoom } as unknown as RoomQueryService;

    save = jest.fn();
    roomRepository = { save, findById: jest.fn(), delete: jest.fn() };

    create = jest.fn();
    createParticipantService = { create };

    service = new EnterRoomService(
      roomQueryService,
      roomRepository,
      createParticipantService,
    );

    generateRandomNickname = jest.spyOn(
      service as never,
      'generateRandomNickname',
    );
  });

  it('존재하는 방에 정원 여유가 있으면 참여자를 생성해 입장시키고 방 정보를 반환한다', () => {
    // given
    const { room, join } = createMockRoom();
    findExistingRoom.mockReturnValue(room);
    generateRandomNickname.mockReturnValue('졸린토마토');
    const participant = createMockParticipant('졸린토마토');
    create.mockReturnValue(participant);

    // when
    const result = service.joinRoom(roomId);

    // then
    expect(create).toHaveBeenCalledWith(expect.any(String), '졸린토마토');
    expect(create).toHaveBeenCalledTimes(1);
    expect(join).toHaveBeenCalledWith(participant);
    expect(save).toHaveBeenCalledWith(room);
    expect(result.participant).toEqual({
      id: participant.id,
      nickname: participant.nickname,
    });
    expect(result.room).toEqual({
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [...room.participants.values()],
    });
  });

  it('존재하지 않는 방에는 입장할 수 없다', () => {
    // given
    findExistingRoom.mockImplementation(() => {
      throw new NotFoundException('존재하지 않는 방입니다.');
    });

    // when / then
    expect(() => service.joinRoom(roomId)).toThrow(NotFoundException);
    expect(create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('생성한 닉네임이 이미 방에 있으면 중복되지 않을 때까지 새 닉네임을 다시 생성한다', () => {
    // given
    const hasNickname = jest
      .fn()
      .mockReturnValueOnce(true) // '형용사A토마토'
      .mockReturnValueOnce(true) // '형용사B토마토'
      .mockReturnValueOnce(false); // '형용사C토마토'
    const { room } = createMockRoom({ hasNickname });
    findExistingRoom.mockReturnValue(room);

    generateRandomNickname
      .mockReturnValueOnce('형용사A토마토')
      .mockReturnValueOnce('형용사B토마토')
      .mockReturnValueOnce('형용사C토마토');

    const participant = createMockParticipant('형용사C토마토');
    create.mockReturnValue(participant);

    // when
    service.joinRoom(roomId);

    // then
    expect(hasNickname).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledWith(expect.any(String), '형용사C토마토');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
