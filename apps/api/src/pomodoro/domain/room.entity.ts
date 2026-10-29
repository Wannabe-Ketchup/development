import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ROOM_MODE, type RoomMode } from '@pomodoro/shared';
import { Participant } from './participant.entity';
import { Timer } from './timer.entity';

const MS_PER_SECOND = 1000;

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
    const timer = Timer.create();
    const capacity = 4;
    const participants = new Map<string, Participant>();
    const currentCycle = 0;

    return new Room(roomId, participants, capacity, timer, mode, currentCycle);
  }

  // 검증하지 않는다. repository 매퍼와 테스트 given에서만 호출한다
  static restore(props: {
    roomId: string;
    participants: Participant[];
    capacity: number;
    timer: Timer;
    mode: RoomMode;
    currentCycle: number;
  }): Room {
    return new Room(
      props.roomId,
      new Map(
        props.participants.map((participant) => [participant.id, participant]),
      ),
      props.capacity,
      props.timer,
      props.mode,
      props.currentCycle,
    );
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

  changeStatusMessage(participantId: string, statusMessage: string): void {
    const participant = this._participants.get(participantId);
    if (!participant) {
      throw new NotFoundException('방에 존재하지 않는 참가자입니다.');
    }

    participant.changeStatusMessage(statusMessage);
  }

  join(participant: Participant): void {
    this.validateCapacity();
    this._participants.set(participant.id, participant);
  }

  leave(participantId: string): void {
    this._participants.delete(participantId);
  }

  private validateParticipant(participantId: string): void {
    if (!this._participants.has(participantId)) {
      throw new NotFoundException('방에 존재하지 않는 참가자입니다.');
    }
  }

  startPomodoro(participantId: string, now: Date): void {
    this.validateParticipant(participantId);
    if (this.isRunning()) {
      throw new ConflictException('이미 진행 중인 뽀모도로입니다.');
    }

    this._mode = ROOM_MODE.FOCUS;
    this._currentCycle = 1;
    this._timer = this._timer.startFocus(now);
  }

  // 모드와 회차는 그대로 두고 타이머만 멈춘다
  pausePomodoro(participantId: string, now: Date): void {
    this.validateParticipant(participantId);
    this._timer = this._timer.pause(now);
  }

  // 모드와 회차는 그대로 두고 타이머만 다시 흐르게 한다
  resumePomodoro(participantId: string, now: Date): void {
    this.validateParticipant(participantId);
    this._timer = this._timer.resume(now);
  }

  // 휴식은 집중이 실제로 처리된 시각이 아니라 끝나기로 예정된 시각에 시작한다
  finishFocus(): void {
    if (this._mode !== ROOM_MODE.FOCUS) {
      throw new ConflictException('집중 중인 방이 아닙니다.');
    }

    const focusEndsAt = this._timer.scheduledEndAt();
    this._mode = ROOM_MODE.BREAK;
    this._timer = this._timer.startBreak(focusEndsAt);
  }

  // 휴식이 끝나면 방에 있는 참여자 모두 한 바퀴를 마친다.
  // 마지막 회차 휴식이 끝나면 대기 상태로, 그 전이면 다음 회차 집중으로 넘어간다
  finishBreak(): void {
    if (this._mode !== ROOM_MODE.BREAK) {
      throw new ConflictException('휴식 중인 방이 아닙니다.');
    }

    this._participants.forEach((participant) => participant.completeCycle());

    if (this._currentCycle >= this._timer.totalCycle) {
      this._mode = ROOM_MODE.IDLE;
      this._currentCycle = 0;
      this._timer = this._timer.reset();
      return;
    }

    const breakEndsAt = this._timer.scheduledEndAt();
    this._mode = ROOM_MODE.FOCUS;
    this._currentCycle += 1;
    this._timer = this._timer.startFocus(breakEndsAt);
  }

  isRunning(): boolean {
    return this._mode !== ROOM_MODE.IDLE;
  }

  // 현재 단계 종료 예정 시각까지 남은 초. 이미 지났으면 0
  remainingSecondsInPhase(now: Date): number {
    const remainingMs = this._timer.scheduledEndAt().getTime() - now.getTime();
    return Math.max(0, remainingMs / MS_PER_SECOND);
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
