import { BadRequestException } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';

describe('Room', () => {
  it('방 생성 시 기본 모드는 IDLE 이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.mode).toBe(ROOM_MODE.IDLE);
  });

  it('방 생성 시 기본 사이클은 0이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.currentCycle).toBe(0);
  });

  it('방 생성 시 타이머는 IDLE 상태의 기본값(집중 25분, 휴식 5분)으로 초기화된다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.timer.status).toBe('IDLE');
    expect(room.timer.focusTimeSec).toBe(1500);
    expect(room.timer.breakTimeSec).toBe(300);
    expect(room.timer.timerStartedAt).toBeNull();
    expect(room.timer.remainingTimeSec).toBe(room.timer.focusTimeSec);
  });

  it('방에 있는 참가자는 퇴장시키면 참가자 목록에서 제거된다.', () => {
    // given
    const room = Room.create('room-1');
    const participant = Participant.create(
      'participant-1',
      'name',
      new Date().toISOString(),
    );
    room.join(participant);

    // when
    room.leave(participant.id);

    // then
    expect(room.participants.size).toBe(0);
  });

  it('참가자는 방의 정원이 비어있으면 방에 참가할 수 있다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    const participant = Participant.create(participantId, nickname, joinedAt);

    // when
    room.join(participant);

    // then
    const expectedSize = 1;
    expect(room.participants.size).toBe(expectedSize);
    expect(room.participants.get(participantId)).toBe(participant);
  });

  it('방의 정원이 모두 찼을 때 새로운 참가자가 입장하면 예외가 발생한다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    const participant1 = Participant.create('1', 'name1', joinedAt);
    const participant2 = Participant.create('2', 'name2', joinedAt);
    const participant3 = Participant.create('3', 'name3', joinedAt);
    const participant4 = Participant.create('4', 'name4', joinedAt);
    room.join(participant1);
    room.join(participant2);
    room.join(participant3);
    room.join(participant4);

    const newParticipant = Participant.create('5', 'name5', joinedAt);

    // when & then
    expect(() => room.join(newParticipant)).toThrow(BadRequestException);
  });

  it('같은 방의 다른 참가자가 쓰지 않는 닉네임이면 변경할 수 있다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '마요';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '마요';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('같은 방의 다른 참가자가 쓰는 닉네임으로는 변경할 수 없다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '머스타드';

    // when & then
    const expectedMessage = '이미 사용 중인 닉네임입니다.';
    expect(() => room.changeNickname(participantId, newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('본인의 현재 닉네임으로 변경하는 경우 중복으로 처리하지 않는다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '케첩';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '케첩';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('중복된 닉네임 변경이 거절되면 두 참가자의 닉네임이 그대로 유지된다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const requesterId = 'A';
    const ownerId = 'B';
    const room = Room.create(roomId);
    room.join(Participant.create(requesterId, '케첩', joinedAt));
    room.join(Participant.create(ownerId, '머스타드', joinedAt));
    const newNickname = '머스타드';

    // when
    expect(() => room.changeNickname(requesterId, newNickname)).toThrow(
      BadRequestException,
    );

    // then
    const expectedRequesterNickname = '케첩';
    const expectedOwnerNickname = '머스타드';
    expect(room.participants.get(requesterId)?.nickname).toBe(
      expectedRequesterNickname,
    );
    expect(room.participants.get(ownerId)?.nickname).toBe(
      expectedOwnerNickname,
    );
  });

  it('방에 없는 참가자의 닉네임은 변경할 수 없다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    room.join(Participant.create('A', '케첩', joinedAt));
    const unknownParticipantId = 'Z';
    const newNickname = '마요';

    // when & then
    const expectedMessage = '방에 존재하지 않는 참가자입니다.';
    expect(() =>
      room.changeNickname(unknownParticipantId, newNickname),
    ).toThrow(expectedMessage);
  });

  it('다른 방의 참가자가 쓰는 닉네임으로는 변경할 수 있다.', () => {
    // given
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'B';
    const room1 = Room.create('roomId1');
    room1.join(Participant.create('A', '케첩', joinedAt));
    const room2 = Room.create('roomId2');
    room2.join(Participant.create(participantId, '머스타드', joinedAt));
    const newNickname = '케첩';

    // when
    room2.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '케첩';
    expect(room2.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('대소문자가 다른 닉네임은 다른 닉네임으로 취급한다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, 'ketchup', joinedAt));
    room.join(Participant.create('B', 'mustard', joinedAt));
    const newNickname = 'Mustard';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = 'Mustard';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });
});
