import { BadRequestException } from '@nestjs/common';
import { Participant } from './participant.entity';

describe('ParticipantTest', () => {
  it('참가자 생성 시 닉네임이 올바르게 설정된다.', () => {
    // given
    const nickname = 'ketchup';

    // when
    const participant = Participant.create(
      'id',
      nickname,
      '2026-09-02T00:00:00.000Z',
    );

    // then
    expect(participant.nickname).toBe(nickname);
  });

  it('참가자 생성 시 현재 사이클은 1이다.', () => {
    // given
    const nickname = 'ketchup';

    // when
    const participant = Participant.create(
      'id',
      nickname,
      '2026-09-02T00:00:00.000Z',
    );

    // then
    const expectedCycle = 1;
    expect(participant.currentCycle).toBe(expectedCycle);
  });

  it('참가자 생성 시 상태 메시지는 비어있다.', () => {
    // given
    const nickname = 'ketchup';

    // when
    const participant = Participant.create(
      'id',
      nickname,
      '2026-09-02T00:00:00.000Z',
    );

    // then
    const expectedStatusMessage = '';
    expect(participant.statusMessage).toBe(expectedStatusMessage);
  });

  it('참가자 생성 시 기본 이름은 10자를 초과할 수 없다.', () => {
    // given
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const nameLength = 11;
    const invalidEngNickname = 't'.repeat(nameLength);
    const invalidKorNickname = '테'.repeat(nameLength);

    // when & then
    expect(() =>
      Participant.create('id', invalidEngNickname, joinedAt),
    ).toThrow(BadRequestException);

    expect(() =>
      Participant.create('id', invalidKorNickname, joinedAt),
    ).toThrow(BadRequestException);
  });
});
