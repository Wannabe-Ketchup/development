import { BadRequestException } from '@nestjs/common';
import type { RoomMode } from '@pomodoro/shared';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

export class Room {
  constructor(
    public readonly roomId: string,
    private _participants: Map<string, Participant>,
    private _capacity: number,
    private _timer: Timer,
    private _mode: RoomMode,
    private _currentCycle: number,
  ) {}

  static create(roomId: string): Room {
    const mode = 'IDLE' as RoomMode;
    const timer = {} as Timer; // TODO: 실제 타이머 엔티티 생성 하도록 수정 필요.
    const capacity = 4;
    const participants = new Map<string, Participant>();
    const currentCycle = 1;

    return new Room(roomId, participants, capacity, timer, mode, currentCycle);
  }

  private validateCapacity(): void {
    if (this._participants.size >= this._capacity) {
      throw new BadRequestException('방의 정원이 모두 찼습니다.');
    }
  }

  hasNickname(targetNickname: string): boolean {
    return [...this._participants.values()].some(
      (participant) => participant.nickname === targetNickname,
    );
  }

  join(participant: Participant): void {
    this.validateCapacity();
    this._participants.set(participant.id, participant);
  }

  get participants(): Map<string, Participant> {
    return this._participants;
  }

  get timer(): Timer {
    return this._timer;
  }

  get mode(): RoomMode {
    return this._mode;
  }

  get currentCycle(): number {
    return this._currentCycle;
  }
}
