import { BadRequestException } from '@nestjs/common';
import { Participant } from '../../../src/pomodoro/domain/../../../src/pomodoro/domain/participant.entity';

describe('ParticipantTest', () => {
  it('참가자 생성 시 닉네임이 올바르게 설정된다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';

    // when
    const participant = Participant.create(participantId, nickname, joinedAt);

    // then
    const expectedNickname = nickname;
    expect(participant.nickname).toBe(expectedNickname);
  });

  it('참가자 생성 시 현재 사이클은 0이다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';

    // when
    const participant = Participant.create(participantId, nickname, joinedAt);

    // then
    const expectedCycle = 0;
    expect(participant.currentCycle).toBe(expectedCycle);
  });

  it('참가자 생성 시 상태 메시지는 비어있다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';

    // when
    const participant = Participant.create(participantId, nickname, joinedAt);

    // then
    const expectedStatusMessage = '';
    expect(participant.statusMessage).toBe(expectedStatusMessage);
  });

  it('닉네임이 허용 문자로만 이루어져 있으면 변경할 수 있다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const newNickname = '사과2';

    // when
    participant.changeNickname(newNickname);

    // then
    const expectedNickname = newNickname;
    expect(participant.nickname).toBe(expectedNickname);
  });

  it('자음과 모음만으로 이루어진 닉네임으로 변경할 수 있다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const newNickname = 'ㅋㅋㅜㅜ';

    // when
    participant.changeNickname(newNickname);

    // then
    const expectedNickname = newNickname;
    expect(participant.nickname).toBe(expectedNickname);
  });

  it('닉네임이 1자 이상 10자 이내면 변경할 수 있다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const nameLength = 10;
    const newNickname = '가'.repeat(nameLength);

    // when
    participant.changeNickname(newNickname);

    // then
    const expectedNickname = newNickname;
    expect(participant.nickname).toBe(expectedNickname);
  });

  it('닉네임이 10자를 초과하면 변경할 수 없다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const nameLength = 11;
    const newNickname = '가'.repeat(nameLength);

    // when & then
    const expectedMessage = '닉네임은 1자 이상 10자 이내입니다.';
    expect(() => participant.changeNickname(newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('빈 닉네임으로는 변경할 수 없다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const newNickname = '';

    // when & then
    const expectedMessage = '닉네임은 1자 이상 10자 이내입니다.';
    expect(() => participant.changeNickname(newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('공백이 포함된 닉네임으로는 변경할 수 없다.', () => {
    // given
    const participantId = 'participantId';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const newNickname = '토 마토';

    // when & then
    const expectedMessage = '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
    expect(() => participant.changeNickname(newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('이모지가 포함된 닉네임으로는 변경할 수 없다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const newNickname = '토마토🍅';

    // when & then
    const expectedMessage = '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
    expect(() => participant.changeNickname(newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('닉네임 변경이 거절되면 기존 닉네임이 유지된다.', () => {
    // given
    const participantId = 'id';
    const currentNickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(
      participantId,
      currentNickname,
      joinedAt,
    );
    const nameLength = 11;
    const invalidNickname = '가'.repeat(nameLength);

    // when
    expect(() => participant.changeNickname(invalidNickname)).toThrow(
      BadRequestException,
    );

    // then
    const expectedNickname = currentNickname;
    expect(participant.nickname).toBe(expectedNickname);
  });
});
