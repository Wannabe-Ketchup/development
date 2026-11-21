import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { ChangeTimerDurationService } from '../../../src/pomodoro/service/change-timer-duration.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

function idleRoom(roomId: string, participantId: string): Room {
  return Room.restore({
    roomId,
    participants: [
      Participant.restore({
        id: participantId,
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: '2026-10-17T08:50:00.000Z',
      }),
    ],
    capacity: 4,
    timer: Timer.restore({
      status: 'IDLE',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: null,
      remainingTimeSec: FOCUS_DURATION_SECONDS,
    }),
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
  });
}

describe('ChangeTimerDurationService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    }).compile();
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('changeTimerDuration', () => {
    it('시간을 바꾸면 저장소에서 다시 읽은 방의 타이머에 바뀐 시간이 남는다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(idleRoom(roomId, participantId));

      // when
      moduleRef
        .get(ChangeTimerDurationService)
        .changeTimerDuration(roomId, participantId, 30, 10);

      // then
      const savedTimer = roomRepository.findById(roomId)?.timer;
      expect(savedTimer?.focusTimeSec).toBe(1800);
      expect(savedTimer?.breakTimeSec).toBe(600);
    });
  });
});
