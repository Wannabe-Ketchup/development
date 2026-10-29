import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  type Timer as TimerShape,
  type TimerStatus,
} from '@pomodoro/shared';

const MS_PER_SECOND = 1000;

interface TimerProps {
  status: TimerStatus;
  focusTimeSec: number;
  breakTimeSec: number;
  totalCycle: number;
  timerStartedAt: string | null;
  remainingTimeSec: number;
}

export class Timer implements TimerShape {
  private constructor(
    readonly status: TimerStatus,
    readonly focusTimeSec: number,
    readonly breakTimeSec: number,
    readonly totalCycle: number,
    readonly timerStartedAt: string | null,
    readonly remainingTimeSec: number,
  ) {}

  static create(): Timer {
    return Timer.of({
      status: 'IDLE',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: null,
      remainingTimeSec: FOCUS_DURATION_SECONDS,
    });
  }

  static of(props: TimerProps): Timer {
    if (props.status === 'RUNNING' && props.timerStartedAt === null) {
      throw new BadRequestException(
        '진행 중인 타이머에는 시작 시각이 있어야 합니다.',
      );
    }
    if (props.status === 'IDLE' && props.timerStartedAt !== null) {
      throw new BadRequestException(
        '대기 중인 타이머에는 시작 시각이 없어야 합니다.',
      );
    }
    if (props.status === 'PAUSED' && props.timerStartedAt !== null) {
      throw new BadRequestException(
        '일시정지 중인 타이머에는 시작 시각이 없어야 합니다.',
      );
    }
    return Timer.restore(props);
  }

  // 검증하지 않는다. repository 매퍼와 테스트 given에서만 호출한다
  static restore(props: TimerProps): Timer {
    return new Timer(
      props.status,
      props.focusTimeSec,
      props.breakTimeSec,
      props.totalCycle,
      props.timerStartedAt,
      props.remainingTimeSec,
    );
  }

  // startedAt부터 집중 시간만큼 진행되는 타이머
  startFocus(startedAt: Date): Timer {
    return Timer.of({
      status: 'RUNNING',
      focusTimeSec: this.focusTimeSec,
      breakTimeSec: this.breakTimeSec,
      totalCycle: this.totalCycle,
      timerStartedAt: startedAt.toISOString(),
      remainingTimeSec: this.focusTimeSec,
    });
  }

  // startedAt부터 휴식 시간만큼 진행되는 타이머
  startBreak(startedAt: Date): Timer {
    return Timer.of({
      status: 'RUNNING',
      focusTimeSec: this.focusTimeSec,
      breakTimeSec: this.breakTimeSec,
      totalCycle: this.totalCycle,
      timerStartedAt: startedAt.toISOString(),
      remainingTimeSec: this.breakTimeSec,
    });
  }

  reset(): Timer {
    return Timer.of({
      status: 'IDLE',
      focusTimeSec: this.focusTimeSec,
      breakTimeSec: this.breakTimeSec,
      totalCycle: this.totalCycle,
      timerStartedAt: null,
      remainingTimeSec: this.focusTimeSec,
    });
  }

  // 화면에 보이던 초(남은 시간의 올림)에서 멈춘다. 단계가 이미 끝났으면 멈추지 않고 곧 올 자동 전환에 맡긴다
  pause(now: Date): Timer {
    if (this.status !== 'RUNNING') {
      throw new ConflictException('진행 중인 타이머가 아닙니다.');
    }
    const remainingMs = this.scheduledEndAt().getTime() - now.getTime();
    if (remainingMs <= 0) {
      throw new ConflictException('이미 끝난 단계는 일시정지할 수 없습니다.');
    }
    return Timer.of({
      status: 'PAUSED',
      focusTimeSec: this.focusTimeSec,
      breakTimeSec: this.breakTimeSec,
      totalCycle: this.totalCycle,
      timerStartedAt: null,
      remainingTimeSec: Math.ceil(remainingMs / MS_PER_SECOND),
    });
  }

  // now부터 멈춘 남은 시간만큼 진행되는 타이머
  resume(now: Date): Timer {
    if (this.status !== 'PAUSED') {
      throw new ConflictException('일시정지 중인 타이머가 아닙니다.');
    }
    return Timer.of({
      status: 'RUNNING',
      focusTimeSec: this.focusTimeSec,
      breakTimeSec: this.breakTimeSec,
      totalCycle: this.totalCycle,
      timerStartedAt: now.toISOString(),
      remainingTimeSec: this.remainingTimeSec,
    });
  }

  // 현재 단계가 끝나기로 예정된 시각
  scheduledEndAt(): Date {
    if (this.status !== 'RUNNING' || this.timerStartedAt === null) {
      throw new ConflictException('진행 중인 타이머가 아닙니다.');
    }
    return new Date(
      new Date(this.timerStartedAt).getTime() +
        this.remainingTimeSec * MS_PER_SECOND,
    );
  }
}
