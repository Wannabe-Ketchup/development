import { NotFoundException } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Registry } from 'prom-client';
import { readMetricValue } from '../../metrics/read-metric-value';
import { Random } from '../../../src/common/random/random';
import { TIMER_EVENT } from '../../../src/pomodoro/constant/timer-event.constant';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { InviteCodeRepository } from '../../../src/pomodoro/repository/invite-code.repository';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import {
  TimerKey,
  TimerScheduler,
} from '../../../src/pomodoro/scheduler/timer.scheduler';
import { CreateRoomService } from '../../../src/pomodoro/service/create-room.service';
import { DeleteEmptyRoomService } from '../../../src/pomodoro/service/delete-empty-room.service';
import { EnterRoomService } from '../../../src/pomodoro/service/enter-room.service';

// 항상 같은 초대코드(AAAAAA)를 만든다. 해제되지 않은 코드면 새 방을 만들 수 없다
class FixedRandom extends Random {
  nextInt(): number {
    return 0;
  }
}

const IDLE_TIMER = Timer.restore({
  status: 'IDLE',
  focusTimeSec: FOCUS_DURATION_SECONDS,
  breakTimeSec: BREAK_DURATION_SECONDS,
  totalCycle: CYCLE_COUNT,
  timerStartedAt: null,
  remainingTimeSec: FOCUS_DURATION_SECONDS,
});

const EMPTY_ROOMS_DELETED = 'empty_rooms_deleted_total';

function restoreRoom(
  roomId: string,
  participants: Participant[],
  emptiedAt?: Date,
): Room {
  return Room.restore({
    roomId,
    participants,
    capacity: 4,
    timer: IDLE_TIMER,
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
    emptiedAt,
  });
}

function restoreParticipant(id: string): Participant {
  return Participant.restore({
    id,
    nickname: id,
    statusMessage: '',
    completedCycles: 0,
    joinedAt: '2026-11-07T00:00:00.000Z',
  });
}

describe('DeleteEmptyRoomService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    })
      .overrideProvider(Random)
      .useClass(FixedRandom)
      .compile();
    await moduleRef.init();

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  describe('deleteEmptyRoom', () => {
    it('방을 삭제하면 초대코드가 해제되어, 그 코드로 입장할 수 없고 다른 방이 받을 수 있다', () => {
      // given
      const roomId = 'room-1';
      const roomRepository = moduleRef.get(RoomRepository);
      const inviteCodeRepository = moduleRef.get(InviteCodeRepository);
      roomRepository.save(restoreRoom(roomId, []));
      inviteCodeRepository.save(roomId, InviteCode.restore('AAAAAA'));

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(() =>
        moduleRef.get(EnterRoomService).joinRoom('AAAAAA', 'participant-1'),
      ).toThrow(NotFoundException);
      const newRoomId = moduleRef.get(CreateRoomService).create();
      expect(inviteCodeRepository.findRoomIdByInviteCode('AAAAAA')).toBe(
        newRoomId,
      );
    });

    it('삭제 시점에 참여자가 있으면 방을 삭제하지 않는다', () => {
      // given
      const roomId = 'room-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(
        restoreRoom(roomId, [restoreParticipant('participant-1')]),
      );

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(roomRepository.findById(roomId)).toBeDefined();
    });

    it('방을 삭제하면 세션 타이머가 취소된다', () => {
      // given
      const roomId = 'room-1';
      moduleRef.get(RoomRepository).save(restoreRoom(roomId, []));
      moduleRef
        .get(TimerScheduler)
        .register(
          TimerKey.session(roomId),
          TIMER_EVENT.FOCUS_TIMEOUT,
          { roomId },
          FOCUS_DURATION_SECONDS,
        );

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(jest.getTimerCount()).toBe(0);
    });

    it('퇴장으로 빈 방이 된 방을 삭제하면 사용된 방의 삭제 수가 늘어난다', async () => {
      // given
      const roomId = 'room-1';
      moduleRef
        .get(RoomRepository)
        .save(restoreRoom(roomId, [], new Date('2026-11-07T00:00:00.000Z')));

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(
        await readMetricValue(moduleRef.get(Registry), EMPTY_ROOMS_DELETED, {
          usage: 'used',
        }),
      ).toBe(1);
    });

    it('입장한 적 없는 방을 삭제하면 입장한 적 없는 방의 삭제 수가 늘어난다', async () => {
      // given
      const roomId = 'room-1';
      moduleRef.get(RoomRepository).save(restoreRoom(roomId, []));

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(
        await readMetricValue(moduleRef.get(Registry), EMPTY_ROOMS_DELETED, {
          usage: 'never_entered',
        }),
      ).toBe(1);
    });

    it('삭제 시점에 참여자가 있어 삭제하지 않으면 삭제 수가 늘어나지 않는다', async () => {
      // given
      const roomId = 'room-1';
      moduleRef
        .get(RoomRepository)
        .save(restoreRoom(roomId, [restoreParticipant('participant-1')]));

      // when
      moduleRef.get(DeleteEmptyRoomService).deleteEmptyRoom(roomId);

      // then
      expect(
        await readMetricValue(moduleRef.get(Registry), EMPTY_ROOMS_DELETED, {
          usage: 'never_entered',
        }),
      ).toBe(0);
    });
  });
});
