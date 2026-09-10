import { NotFoundException } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { EnterRoomService } from './enter-room.service';
import { RoomQueryService } from './room-query.service';
import { RoomPresenceService } from './room-presence.service';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';
import { Participant } from '../domain/participant.entity';
import { CreateParticipantService } from './create-participant.service';

describe('EnterRoomService.joinRoom', () => {
  const roomId = 'room-1';

  const createMockRoom = (
    roomOverrides: {
      hasNickname?: jest.Mock;
      participants?: Map<string, Participant>;
    } = {},
  ) => {
    const hasNickname =
      roomOverrides.hasNickname ?? jest.fn().mockReturnValue(false);
    const join = jest.fn();
    const participants = roomOverrides.participants ?? new Map();

    const room = {
      roomId,
      participants,
      mode: ROOM_MODE.IDLE,
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

  let registerPendingParticipant: jest.Mock;
  let roomPresenceService: RoomPresenceService;

  let service: EnterRoomService;

  beforeEach(() => {
    jest.clearAllMocks();

    findExistingRoom = jest.fn();
    const toRoom = jest.fn((room: Room) => ({
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [...room.participants.values()],
    }));
    roomQueryService = {
      findExistingRoom,
      toRoom,
    } as unknown as RoomQueryService;

    save = jest.fn();
    roomRepository = { save, findById: jest.fn(), delete: jest.fn() };

    create = jest.fn();
    createParticipantService = { create };

    registerPendingParticipant = jest.fn();
    roomPresenceService = {
      registerPendingParticipant,
    };

    service = new EnterRoomService(
      roomQueryService,
      roomRepository,
      createParticipantService,
      roomPresenceService,
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
    expect(create).toHaveBeenCalledWith('졸린토마토', expect.any(String));
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
    expect(create).toHaveBeenCalledWith('형용사C토마토', expect.any(String));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('새로 입장하는 참가자는 퇴장 타이머가 등록된다', () => {
    // given
    const { room } = createMockRoom();
    findExistingRoom.mockReturnValue(room);
    generateRandomNickname.mockReturnValue('졸린토마토');
    const participant = createMockParticipant('졸린토마토');
    create.mockReturnValue(participant);

    // when
    service.joinRoom(roomId);

    // then
    expect(registerPendingParticipant).toHaveBeenCalledWith(
      roomId,
      participant.id,
    );
  });

  it('이미 방에 참여 중인 participantId로 다시 입장을 요청하면 새 참가자를 만들지 않고 기존 상태를 그대로 반환한다', () => {
    // given
    const existingParticipant = createMockParticipant('졸린토마토');
    const { room, join } = createMockRoom({
      participants: new Map([[existingParticipant.id, existingParticipant]]),
    });
    findExistingRoom.mockReturnValue(room);

    // when
    const result = service.joinRoom(roomId, existingParticipant.id);

    // then
    expect(create).not.toHaveBeenCalled();
    expect(join).not.toHaveBeenCalled();
    expect(registerPendingParticipant).not.toHaveBeenCalled();
    expect(result.participant).toEqual({
      id: existingParticipant.id,
      nickname: existingParticipant.nickname,
    });
  });

  it('방에 없는 participantId로 입장을 요청하면 새 참가자로 취급해 정상 입장시킨다', () => {
    // given
    const { room, join } = createMockRoom();
    findExistingRoom.mockReturnValue(room);
    generateRandomNickname.mockReturnValue('졸린토마토');
    const participant = createMockParticipant('졸린토마토');
    create.mockReturnValue(participant);

    // when
    service.joinRoom(roomId, 'not-existing-participant-id');

    // then
    expect(create).toHaveBeenCalledTimes(1);
    expect(join).toHaveBeenCalledWith(participant);
    expect(registerPendingParticipant).toHaveBeenCalledWith(
      roomId,
      participant.id,
    );
  });
});
