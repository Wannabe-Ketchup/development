import { BadRequestException } from '@nestjs/common';
import type { Participant as ParticipantShape } from '@pomodoro/shared';

export class Participant implements ParticipantShape {
  private constructor(
    public readonly id: string,
    private _nickname: string,
    private _statusMessage: string,
    private _currentCycle: number,
    private _joinedAt: string,
  ) {}

  static create(id: string, nickname: string, joinedAt: string): Participant {
    if (nickname.length > 10) {
      throw new BadRequestException('닉네임은 10자를 초과할 수 없습니다.');
    }

    const currentCycle = 1;
    const statusMessage = '';
    return new Participant(id, nickname, statusMessage, currentCycle, joinedAt);
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
