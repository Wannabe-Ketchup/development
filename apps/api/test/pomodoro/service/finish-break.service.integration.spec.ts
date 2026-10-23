import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Clock } from '../../../src/common/clock/clock';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { FinishBreakService } from '../../../src/pomodoro/service/finish-break.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const NOW = new Date('2026-10-17T11:00:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

describe('FinishBreakService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    })
      .overrideProvider(Clock)
      .useClass(FixedClock)
      .compile();
    await moduleRef.init();

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  describe('finishBreak', () => {
    it('마지막 회차 휴식을 마치면 저장소의 방이 대기 상태로 남고, 이후 시간이 지나도 다시 시작되지 않는다', () => {
      // given: 마지막 회차 휴식이 지금(NOW) 끝나기로 예정된 방
      const roomId = 'room-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(
        Room.restore({
          roomId,
          participants: [
            Participant.create(
              'participant-1',
              '케첩',
              '2026-10-17T08:50:00.000Z',
            ),
          ],
          capacity: 4,
          timer: Timer.restore({
            status: 'RUNNING',
            focusTimeSec: FOCUS_DURATION_SECONDS,
            breakTimeSec: BREAK_DURATION_SECONDS,
            totalCycle: CYCLE_COUNT,
            timerStartedAt: '2026-10-17T10:55:00.000Z',
            remainingTimeSec: BREAK_DURATION_SECONDS,
          }),
          mode: ROOM_MODE.BREAK,
          currentCycle: CYCLE_COUNT,
        }),
      );

      // when
      moduleRef.get(FinishBreakService).finishBreak(roomId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.mode).toBe(ROOM_MODE.IDLE);
      expect(savedRoom?.currentCycle).toBe(0);
      // 다음 단계 타이머가 등록되지 않았으므로 시간이 지나도 상태가 바뀌지 않는다
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
