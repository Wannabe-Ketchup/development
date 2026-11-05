import { Test } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { InMemoryInviteCodeRepository } from '../../../src/pomodoro/repository/in-memory.invite-code.repository';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { InviteCodeRepository } from '../../../src/pomodoro/repository/invite-code.repository';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { FindInviteCodeService } from '../../../src/pomodoro/service/find-invite-code.service';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';

describe('FindInviteCodeService', () => {
  describe('findInviteCode', () => {
    it('방 참여자가 조회하면 그 방에 저장된 초대코드가 돌아온다', async () => {
      // given
      const moduleRef = await Test.createTestingModule({
        providers: [
          FindInviteCodeService,
          RoomQueryService,
          { provide: RoomRepository, useClass: InMemoryRoomRepository },
          {
            provide: InviteCodeRepository,
            useClass: InMemoryInviteCodeRepository,
          },
        ],
      }).compile();
      const roomId = 'room-1';
      const participantId = 'A';
      moduleRef.get(RoomRepository).save(
        Room.restore({
          roomId,
          participants: [
            Participant.restore({
              id: participantId,
              nickname: '케첩',
              statusMessage: '',
              completedCycles: 0,
              joinedAt: '2026-11-05T00:00:00.000Z',
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
        }),
      );
      moduleRef
        .get(InviteCodeRepository)
        .save(roomId, InviteCode.restore('K3TQ7M'));

      // when
      const inviteCode = moduleRef
        .get(FindInviteCodeService)
        .findInviteCode(roomId, participantId);

      // then
      expect(inviteCode.value).toBe('K3TQ7M');
    });
  });
});
