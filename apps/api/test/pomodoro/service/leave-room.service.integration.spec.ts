import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { EMPTY_ROOM_DELETION_DELAY_SEC } from '../../../src/pomodoro/constant/room-deletion.constant';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';

const MS_PER_SECOND = 1000;
const DELETION_DELAY_MS = EMPTY_ROOM_DELETION_DELAY_SEC * MS_PER_SECOND;

function restoreParticipant(id: string): Participant {
  return Participant.restore({
    id,
    nickname: id,
    statusMessage: '',
    completedCycles: 0,
    joinedAt: '2026-11-07T00:00:00.000Z',
  });
}

function restoreRoom(roomId: string, participantIds: string[]): Room {
  return Room.restore({
    roomId,
    participants: participantIds.map(restoreParticipant),
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

describe('LeaveRoomService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    }).compile();
    await moduleRef.init();

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  describe('leaveRoom', () => {
    it('마지막 참여자가 퇴장하면 30분 뒤 방이 삭제되고, 30분 직전에는 남아 있다', () => {
      // given
      const roomId = 'room-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(restoreRoom(roomId, ['participant-1']));

      // when
      moduleRef.get(LeaveRoomService).leaveRoom(roomId, 'participant-1');
      jest.advanceTimersByTime(DELETION_DELAY_MS - 1);

      // then
      expect(roomRepository.findById(roomId)).toBeDefined();

      // when
      jest.advanceTimersByTime(1);

      // then
      expect(roomRepository.findById(roomId)).toBeUndefined();
    });

    it('참여자가 남아 있으면 퇴장해도 삭제가 예약되지 않는다', () => {
      // given
      const roomId = 'room-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(
        restoreRoom(roomId, ['participant-1', 'participant-2']),
      );

      // when
      moduleRef.get(LeaveRoomService).leaveRoom(roomId, 'participant-1');

      // then
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
