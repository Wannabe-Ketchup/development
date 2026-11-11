import { ServiceUnavailableException } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { Random } from '../../../src/common/random/random';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';
import { InMemoryInviteCodeRepository } from '../../../src/pomodoro/repository/in-memory.invite-code.repository';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { InviteCodeRepository } from '../../../src/pomodoro/repository/invite-code.repository';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { TimerScheduler } from '../../../src/pomodoro/scheduler/timer.scheduler';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { EMPTY_ROOM_DELETION_DELAY_SEC } from '../../../src/pomodoro/constant/room-deletion.constant';
import { CreateRoomService } from '../../../src/pomodoro/service/create-room.service';

class FixedRandom extends Random {
  nextInt(): number {
    return 0;
  }
}

async function createService() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      CreateRoomService,
      { provide: RoomRepository, useClass: InMemoryRoomRepository },
      { provide: InviteCodeRepository, useClass: InMemoryInviteCodeRepository },
      EventEmitter2,
      { provide: TimerScheduler, useClass: InMemoryTimerScheduler },
      { provide: Random, useClass: FixedRandom },
    ],
  }).compile();

  return {
    service: moduleRef.get(CreateRoomService),
    roomRepository: moduleRef.get(RoomRepository),
    inviteCodeRepository: moduleRef.get(InviteCodeRepository),
  };
}

const MS_PER_SECOND = 1000;

describe('CreateRoomService', () => {
  beforeEach(() => {
    // 방을 만들 때 거는 30분 삭제 예약이 테스트 뒤에 남지 않게 한다
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('방을 만들면 그 방의 초대코드가 저장소에 남는다', async () => {
      // given
      const { service, inviteCodeRepository } = await createService();

      // when
      const roomId = service.create();

      // then
      expect(inviteCodeRepository.findByRoomId(roomId)?.value).toBe('AAAAAA');
    });

    it('초대코드를 발급하지 못하면 방이 저장되지 않는다', async () => {
      // given
      const { service, roomRepository, inviteCodeRepository } =
        await createService();
      inviteCodeRepository.save('other-room', InviteCode.restore('AAAAAA'));
      const saveRoom = jest.spyOn(roomRepository, 'save');

      // when & then
      expect(() => service.create()).toThrow(ServiceUnavailableException);
      expect(saveRoom).not.toHaveBeenCalled();
    });

    it('입장한 적 없는 방은 만들고 30분 뒤 삭제된다', async () => {
      // given
      const moduleRef = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot(), PomodoroModule],
      }).compile();
      await moduleRef.init();
      const service = moduleRef.get(CreateRoomService);
      const roomRepository = moduleRef.get(RoomRepository);

      // when
      const roomId = service.create();
      jest.advanceTimersByTime(EMPTY_ROOM_DELETION_DELAY_SEC * MS_PER_SECOND);

      // then
      expect(roomRepository.findById(roomId)).toBeUndefined();

      await moduleRef.close();
    });
  });
});
