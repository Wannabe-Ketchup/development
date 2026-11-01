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

  it('참가자를 새로 만들면 마친 바퀴 수는 0이다', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';

    // when
    const participant = Participant.create(participantId, nickname, joinedAt);

    // then
    const expectedCompletedCycles = 0;
    expect(participant.completedCycles).toBe(expectedCompletedCycles);
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

  const RESTORE_JOINED_AT = '2026-09-02T00:00:00.000Z';

  it.each([
    { case: '한글 7자', nickname: '가'.repeat(7) },
    { case: '영문 11자', nickname: 'a'.repeat(11) },
    { case: '숫자 11자', nickname: '1'.repeat(11) },
    { case: '자음 7자', nickname: 'ㅋ'.repeat(7) },
    { case: '한글 6자와 영문 2자', nickname: '가'.repeat(6) + 'ab' },
    { case: '공백 하나', nickname: ' ' },
    { case: '공백 셋', nickname: '   ' },
    { case: '앞뒤 공백이 있는 닉네임', nickname: ' 토마토 ' },
    { case: '중간 공백이 있는 닉네임', nickname: '토 마토' },
  ])(
    "'$case'처럼 가중치 합이 11 이하인 닉네임으로 변경할 수 있다",
    ({ nickname }) => {
      // given
      const participant = Participant.restore({
        id: 'id',
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: RESTORE_JOINED_AT,
      });

      // when
      participant.changeNickname(nickname);

      // then
      expect(participant.nickname).toBe(nickname);
    },
  );

  it.each([
    { case: '한글 8자', nickname: '가'.repeat(8) },
    { case: '한글 7자와 영문 1자', nickname: '가'.repeat(7) + 'a' },
    { case: '영문 12자', nickname: 'a'.repeat(12) },
    { case: '한글 7자와 공백 1자', nickname: '가'.repeat(7) + ' ' },
  ])(
    "'$case'처럼 가중치 합이 11을 넘는 닉네임으로는 변경할 수 없다",
    ({ nickname }) => {
      // given
      const participant = Participant.restore({
        id: 'id',
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: RESTORE_JOINED_AT,
      });

      // when & then
      const expectedMessage = '닉네임이 너무 깁니다. 줄여 주세요.';
      expect(() => participant.changeNickname(nickname)).toThrow(
        expectedMessage,
      );
    },
  );

  it.each([
    { case: '탭', nickname: '토\u0009마토' },
    { case: '줄바꿈', nickname: '토\u000A마토' },
    { case: 'NBSP', nickname: '토\u00A0마토' },
    { case: '전각 공백', nickname: '토\u3000마토' },
    { case: '한글 채움 문자', nickname: '토\u3164마토' },
    { case: '조합형 한글', nickname: '\u1112\u1161\u11AB' },
  ])(
    "'$case'처럼 스페이스가 아닌 공백이나 허용하지 않는 문자가 든 닉네임으로는 변경할 수 없다",
    ({ nickname }) => {
      // given
      const participant = Participant.restore({
        id: 'id',
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: RESTORE_JOINED_AT,
      });

      // when & then
      const expectedMessage =
        '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.';
      expect(() => participant.changeNickname(nickname)).toThrow(
        expectedMessage,
      );
    },
  );

  it('허용하지 않는 문자를 길게 쓴 닉네임은 길이보다 허용 문자 오류로 먼저 거절된다', () => {
    // given
    const participant = Participant.restore({
      id: 'id',
      nickname: '케첩',
      statusMessage: '',
      completedCycles: 0,
      joinedAt: RESTORE_JOINED_AT,
    });
    // \uAC00\uC911\uCE58 24\uB85C \uAE38\uC774 \uD55C\uB3C4(22)\uB3C4 \uB118\uB294 \uC785\uB825\uC774\uB77C, \uB450 \uAC80\uC0AC \uC911 \uD5C8\uC6A9 \uBB38\uC790\uAC00 \uBA3C\uC800\uC778\uC9C0 \uB4DC\uB7EC\uB09C\uB2E4
    const newNickname = '\u6F22'.repeat(12);

    // when & then
    const expectedMessage =
      '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.';
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
    const expectedMessage = '닉네임을 입력해 주세요.';
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
    const expectedMessage =
      '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.';
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

  it('10자 이내의 상태메시지로 변경할 수 있다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(participantId, nickname, joinedAt);
    const newStatusMessage = '가'.repeat(10);

    // when
    participant.changeStatusMessage(newStatusMessage);

    // then
    expect(participant.statusMessage).toBe(newStatusMessage);
  });

  it('상태메시지가 10자를 초과하면 변경할 수 없다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(participantId, nickname, joinedAt);
    const newStatusMessage = '가'.repeat(11);

    // when & then
    const expectedMessage = '상태메시지는 10자 이내입니다.';
    expect(() => participant.changeStatusMessage(newStatusMessage)).toThrow(
      expectedMessage,
    );
  });

  it('빈 문자로 상태메시지를 변경할 수 있다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(participantId, nickname, joinedAt);
    participant.changeStatusMessage('기존 메시지');
    const newStatusMessage = '';

    // when
    participant.changeStatusMessage(newStatusMessage);

    // then
    expect(participant.statusMessage).toBe(newStatusMessage);
  });

  it('상태메시지 변경이 거절되면 기존 상태메시지가 그대로 유지된다.', () => {
    // given
    const participantId = 'id';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participant = Participant.create(participantId, nickname, joinedAt);
    const originalStatusMessage = '기존 메시지';
    participant.changeStatusMessage(originalStatusMessage);
    const invalidStatusMessage = '가'.repeat(11);

    // when
    expect(() => participant.changeStatusMessage(invalidStatusMessage)).toThrow(
      BadRequestException,
    );

    // then
    expect(participant.statusMessage).toBe(originalStatusMessage);
  });
});
