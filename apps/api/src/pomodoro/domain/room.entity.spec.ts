import { BadRequestException } from '@nestjs/common';
import { Room } from './room.entity';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

describe('RoomTest', () => {
  it('방 생성 시 기본 모드는 idle 이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.mode).toBe('IDLE');
  });

  it('방 생성 시 기본 사이클은 1이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.currentCycle).toBe(1);
  });

  it('참가자는 방의 정원이 비어있으면 방에 참가할 수 있다.', () => {
    // given
    const room = createRoom();
    const participant = createParticipant();

    // when
    room.join(participant);

    // then
    const expectedSize = 1;
    expect(room.participants.size).toBe(expectedSize);
    expect(room.participants.get(participant.id)).toBe(participant);
  });

  it('방의 정원이 모두 찼을 때 새로운 참가자가 입장하면 예외를 발생한다.', () => {
    // given
    const room = createRoom();
    const participant1 = createParticipant('1', 'name1');
    const participant2 = createParticipant('2', 'name2');
    const participant3 = createParticipant('3', 'name3');
    const participant4 = createParticipant('4', 'name4');
    room.join(participant1);
    room.join(participant2);
    room.join(participant3);
    room.join(participant4);

    const newParticipant = createParticipant('5', 'new');

    // when & then
    expect(() => room.join(newParticipant)).toThrow(BadRequestException);
  });

  it('방에 특정 닉네임을 가진 참가자가 존재하면 true를 반환한다', () => {
    // given
    const room = createRoom();
    const participant = createParticipant('1', 'ketchup');
    room.join(participant);

    // when
    const result = room.hasNickname('ketchup');

    // then
    expect(result).toBe(true);
  });

  it('방에 특정 닉네임을 가진 참가자가 없으면 false를 반환한다', () => {
    // given
    const room = createRoom();
    const participant = createParticipant('1', 'ketchup');
    room.join(participant);

    // when
    const result = room.hasNickname('mustard');

    // then
    expect(result).toBe(false);
  });

  it('대소문자가 다를 경우 다른 닉네임으로 판단하여 false를 반환한다', () => {
    // given
    const room = createRoom();
    const participant = createParticipant('1', 'ketchup');
    room.join(participant);

    // when
    const result = room.hasNickname('Ketchup');

    // then
    expect(result).toBe(false);
  });

  const createParticipant = (
    id = 'participantId',
    nickname = 'name',
  ): Participant => {
    const participant = Object.create(Participant.prototype) as Participant;
    Object.assign(participant, {
      id,
      _nickname: nickname,
      _statusMessage: '',
      _currentCycle: 1,
      _joinedAt: new Date().toISOString(),
    });
    return participant;
  };

  const createRoom = (
    roomId = 'roomId',
    participants = new Map<string, Participant>(),
    timer = {} as Timer,
    mode = 'IDLE',
    currentCycle = 1,
  ): Room => {
    const room = Object.create(Room.prototype) as Room;
    Object.assign(room, {
      roomId,
      _participants: participants,
      _timer: timer,
      _mode: mode,
      _currentCycle: currentCycle,
      _capacity: 4,
    });
    return room;
  };
});
