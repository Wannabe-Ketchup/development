import { BadRequestException } from '@nestjs/common';
import {
  NICKNAME_ALLOWED_PATTERN,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  type Participant as ParticipantShape,
} from '@pomodoro/shared';

export class Participant implements ParticipantShape {
  private constructor(
    public readonly id: string,
    private _nickname: string,
    private _statusMessage: string,
    private _currentCycle: number,
    private _joinedAt: string,
  ) {}

  private static validateNickname(nickname: string): void {
    if (
      nickname.length < NICKNAME_MIN_LENGTH ||
      nickname.length > NICKNAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상 ${NICKNAME_MAX_LENGTH}자 이내입니다.`,
      );
    }

    if (!NICKNAME_ALLOWED_PATTERN.test(nickname)) {
      throw new BadRequestException(
        '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      );
    }
  }

  static create(id: string, nickname: string, joinedAt: string): Participant {
    Participant.validateNickname(nickname);

    const currentCycle = 0;
    const statusMessage = '';
    return new Participant(id, nickname, statusMessage, currentCycle, joinedAt);
  }

  public changeNickname(nickname: string): void {
    Participant.validateNickname(nickname);
    this._nickname = nickname;
  }

  get nickname(): string {
    return this._nickname;
  }

  get statusMessage(): string {
    return this._statusMessage;
  }

  get currentCycle(): number {
    return this._currentCycle;
  }

  get joinedAt(): string {
    return this._joinedAt;
  }
}
