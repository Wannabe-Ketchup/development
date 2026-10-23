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
import { FinishFocusService } from '../../../src/pomodoro/service/finish-focus.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const MS_PER_SECOND = 1000;
const NOW = new Date('2026-10-17T09:25:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

describe('FinishFocusService', () => {
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

  describe('finishFocus', () => {
    it('집중을 마치면 저장소의 방이 휴식으로 남고, 휴식 시간이 지나면 다음 회차 집중으로 바뀐다', () => {
      // given: 2회차 집중이 지금(NOW) 끝나기로 예정된 방
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
            timerStartedAt: '2026-10-17T09:00:00.000Z',
            remainingTimeSec: FOCUS_DURATION_SECONDS,
          }),
          mode: ROOM_MODE.FOCUS,
          currentCycle: 2,
        }),
      );

      // when
      moduleRef.get(FinishFocusService).finishFocus(roomId);

      // then
      expect(roomRepository.findById(roomId)?.mode).toBe(ROOM_MODE.BREAK);

      // when: 휴식 시간이 지난다
      jest.advanceTimersByTime(BREAK_DURATION_SECONDS * MS_PER_SECOND);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.mode).toBe(ROOM_MODE.FOCUS);
      expect(savedRoom?.currentCycle).toBe(3);
    });
  });
});
