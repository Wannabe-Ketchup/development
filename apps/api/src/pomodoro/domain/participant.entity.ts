import { BadRequestException } from '@nestjs/common';
import {
  getNicknameWeight,
  NICKNAME_ALLOWED_PATTERN,
  NICKNAME_MAX_WEIGHT,
  NICKNAME_MIN_LENGTH,
  STATUS_MESSAGE_MAX_LENGTH,
  type Participant as ParticipantShape,
} from '@pomodoro/shared';

export class Participant implements ParticipantShape {
  private constructor(
    public readonly id: string,
    private _nickname: string,
    private _statusMessage: string,
    private _completedCycles: number,
    private _joinedAt: string,
  ) {}

  // 검증하지 않는다. repository 매퍼와 테스트 given에서만 호출한다
  static restore(props: {
    id: string;
    nickname: string;
    statusMessage: string;
    completedCycles: number;
    joinedAt: string;
  }): Participant {
    return new Participant(
      props.id,
      props.nickname,
      props.statusMessage,
      props.completedCycles,
      props.joinedAt,
    );
  }

  // 방의 휴식이 끝날 때 Room이 호출한다
  completeCycle(): void {
    this._completedCycles += 1;
  }

  private static validateNickname(nickname: string): void {
    if (nickname.length < NICKNAME_MIN_LENGTH) {
      throw new BadRequestException('닉네임을 입력해 주세요.');
    }

    if (!NICKNAME_ALLOWED_PATTERN.test(nickname)) {
      throw new BadRequestException(
        '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.',
      );
    }

    if (getNicknameWeight(nickname) > NICKNAME_MAX_WEIGHT) {
      throw new BadRequestException('닉네임이 너무 깁니다. 줄여 주세요.');
    }
  }

  static create(id: string, nickname: string, joinedAt: string): Participant {
    Participant.validateNickname(nickname);

    const completedCycles = 0;
    const statusMessage = '';
    return new Participant(
      id,
      nickname,
      statusMessage,
      completedCycles,
      joinedAt,
    );
  }

  public changeNickname(nickname: string): void {
    Participant.validateNickname(nickname);
    this._nickname = nickname;
  }

  private static validateStatusMessage(statusMessage: string): void {
    if (statusMessage.length > STATUS_MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `상태메시지는 ${STATUS_MESSAGE_MAX_LENGTH}자 이내입니다.`,
      );
    }
  }

  public changeStatusMessage(statusMessage: string): void {
    Participant.validateStatusMessage(statusMessage);
    this._statusMessage = statusMessage;
  }

  get nickname(): string {
    return this._nickname;
  }

  get statusMessage(): string {
    return this._statusMessage;
  }

  get completedCycles(): number {
    return this._completedCycles;
  }

  get joinedAt(): string {
    return this._joinedAt;
  }
}
