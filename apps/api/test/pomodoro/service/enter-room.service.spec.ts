import { NotFoundException } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { EnterRoomService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/enter-room.service';
import { RoomQueryService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/room-query.service';
import { RoomPresenceService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/room-presence.service';
import { RoomRepository } from '../../../src/pomodoro/service/../repository/room.repository';
import { Room } from '../../../src/pomodoro/service/../domain/room.entity';
import { Participant } from '../../../src/pomodoro/service/../domain/participant.entity';

describe('EnterRoomService.joinRoom', () => {
  const roomId = 'room-1';
  const sessionParticipantId = 'session-participant-id';

  const createMockRoom = (
    roomOverrides: {
      hasNickname?: jest.Mock;
      participants?: Map<string, Participant>;
    } = {},
  ) => {
    const hasNickname =
      roomOverrides.hasNickname ?? jest.fn().mockReturnValue(false);
    const join = jest.fn<void, [Participant]>();
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

  let generateRandomNickname: jest.SpyInstance;

  let registerPendingParticipant: jest.Mock;
  let roomPresenceService: RoomPresenceService;

  let service: EnterRoomService;

  beforeEach(() => {
    jest.clearAllMocks();

    findExistingRoom = jest.fn();
    roomQueryService = {
      findExistingRoom,
    } as unknown as RoomQueryService;

    save = jest.fn();
    roomRepository = { save, findById: jest.fn(), delete: jest.fn() };

    registerPendingParticipant = jest.fn();
    roomPresenceService = {
      registerPendingParticipant,
    };

    service = new EnterRoomService(
      roomQueryService,
      roomRepository,
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

    // when
    const result = service.joinRoom(roomId, sessionParticipantId);

    // then
    expect(join).toHaveBeenCalledTimes(1);
    const joined = join.mock.calls[0][0];
    expect(joined.id).toBe(sessionParticipantId);
    expect(joined.nickname).toBe('졸린토마토');
    expect(save).toHaveBeenCalledWith(room);
    expect(result.participant).toEqual({
      id: sessionParticipantId,
      nickname: '졸린토마토',
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
    expect(() => service.joinRoom(roomId, sessionParticipantId)).toThrow(
      NotFoundException,
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('생성한 닉네임이 이미 방에 있으면 중복되지 않을 때까지 새 닉네임을 다시 생성한다', () => {
    // given
    const hasNickname = jest
      .fn()
      .mockReturnValueOnce(true) // '형용사A토마토'
      .mockReturnValueOnce(true) // '형용사B토마토'
      .mockReturnValueOnce(false); // '형용사C토마토'
    const { room, join } = createMockRoom({ hasNickname });
    findExistingRoom.mockReturnValue(room);

    generateRandomNickname
      .mockReturnValueOnce('형용사A토마토')
      .mockReturnValueOnce('형용사B토마토')
      .mockReturnValueOnce('형용사C토마토');

    // when
    service.joinRoom(roomId, sessionParticipantId);

    // then
    expect(hasNickname).toHaveBeenCalledTimes(3);
    expect(join).toHaveBeenCalledTimes(1);
    expect(join.mock.calls[0][0].nickname).toBe('형용사C토마토');
  });

  it('새로 입장하는 참가자는 퇴장 타이머가 등록된다', () => {
    // given
    const { room } = createMockRoom();
    findExistingRoom.mockReturnValue(room);
    generateRandomNickname.mockReturnValue('졸린토마토');

    // when
    service.joinRoom(roomId, sessionParticipantId);

    // then
    expect(registerPendingParticipant).toHaveBeenCalledWith(
      roomId,
      sessionParticipantId,
    );
  });

  it('같은 로그인 세션이 다시 입장하면 새 참가자를 만들지 않고 기존 상태를 그대로 반환한다', () => {
    // given
    const existingParticipant = createMockParticipant('졸린토마토');
    const { room, join } = createMockRoom({
      participants: new Map([[existingParticipant.id, existingParticipant]]),
    });
    findExistingRoom.mockReturnValue(room);

    // when
    const result = service.joinRoom(roomId, existingParticipant.id);

    // then
    expect(join).not.toHaveBeenCalled();
    expect(registerPendingParticipant).not.toHaveBeenCalled();
    expect(result.participant).toEqual({
      id: existingParticipant.id,
      nickname: existingParticipant.nickname,
    });
  });

  it('방에 없는 로그인 세션이 입장하면 새 참가자로 취급해 정상 입장시킨다', () => {
    // given
    const { room, join } = createMockRoom();
    findExistingRoom.mockReturnValue(room);
    generateRandomNickname.mockReturnValue('졸린토마토');

    // when
    service.joinRoom(roomId, 'not-existing-participant-id');

    // then
    expect(join).toHaveBeenCalledTimes(1);
    expect(join.mock.calls[0][0].id).toBe('not-existing-participant-id');
    expect(registerPendingParticipant).toHaveBeenCalledWith(
      roomId,
      'not-existing-participant-id',
    );
  });
});
