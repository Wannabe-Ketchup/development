import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ROOM_MODE,
  type RoomMode,
  FOCUS_DURATION_SECONDS,
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
} from '@pomodoro/shared';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

export class Room {
  private constructor(
    public readonly roomId: string,
    private _participants: Map<string, Participant>,
    private _capacity: number,
    private _timer: Timer,
    private _mode: RoomMode,
    private _currentCycle: number,
  ) {}

  static create(roomId: string): Room {
    const mode = ROOM_MODE.IDLE;
    const timer = new Timer(
      'IDLE',
      FOCUS_DURATION_SECONDS,
      BREAK_DURATION_SECONDS,
      CYCLE_COUNT,
      null,
      FOCUS_DURATION_SECONDS,
    );
    const capacity = 4;
    const participants = new Map<string, Participant>();
    const currentCycle = 0;

    return new Room(roomId, participants, capacity, timer, mode, currentCycle);
  }

  private validateCapacity(): void {
    if (this._participants.size >= this._capacity) {
      throw new BadRequestException('방의 정원이 모두 찼습니다.');
    }
  }

  hasNickname(targetNickname: string, excludeParticipantId?: string): boolean {
    return [...this._participants.values()].some(
      (participant) =>
        participant.id !== excludeParticipantId &&
        participant.nickname === targetNickname,
    );
  }

  changeNickname(participantId: string, nickname: string): void {
    const participant = this._participants.get(participantId);
    if (!participant) {
      throw new NotFoundException('방에 존재하지 않는 참가자입니다.');
    }

    if (this.hasNickname(nickname, participantId)) {
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');
    }

    participant.changeNickname(nickname);
  }

  join(participant: Participant): void {
    this.validateCapacity();
    this._participants.set(participant.id, participant);
  }

  leave(participantId: string): void {
    this._participants.delete(participantId);
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
