import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Random } from '../../common/random/random';
import { InviteCodeIssuer } from '../domain/invite-code-issuer';
import { Room } from '../domain/room.entity';
import { InviteCodeRepository } from '../repository/invite-code.repository';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { TIMER_EVENT } from '../constant/timer-event.constant';
import { EMPTY_ROOM_DELETION_DELAY_SEC } from '../constant/room-deletion.constant';

@Injectable()
export class CreateRoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly inviteCodeRepository: InviteCodeRepository,
    private readonly random: Random,
    private readonly timerScheduler: TimerScheduler,
  ) {}

  // 코드 발급부터 저장까지 await 없는 동기 구간으로 유지한다. 확인과 등록 사이에 다른 요청이 끼어들지 않아야 한다
  public create(): string {
    // 발급에 실패하면 503이고 아무것도 저장하지 않는다
    const inviteCode = InviteCodeIssuer.issue(
      (bound) => this.random.nextInt(bound),
      (code) => this.inviteCodeRepository.exists(code),
    );

    const roomId = crypto.randomUUID();
    const room = Room.create(roomId);
    this.roomRepository.save(room);
    this.inviteCodeRepository.save(roomId, inviteCode);

    // 생성과 입장은 별개의 요청이다. 입장하지 않으면 이 예약으로 지워지고, 입장하면 취소된다
    this.timerScheduler.register(
      TimerKey.roomDeletion(roomId),
      TIMER_EVENT.ROOM_DELETION_TIMEOUT,
      { roomId },
      EMPTY_ROOM_DELETION_DELAY_SEC,
    );

    return roomId;
  }
}
