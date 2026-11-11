import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { MetricsService } from '../../metrics/metrics.service';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { RoomPresenceTracker } from './room-presence.tracker';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import type { JoinRoomResponse } from '@pomodoro/shared';
import { RoomDto } from '../dto/room.dto';
import { Participant } from '../domain/participant.entity';

const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운', '멋진'];

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly roomPresenceTracker: RoomPresenceTracker,
    private readonly timerScheduler: TimerScheduler,
    private readonly clock: Clock,
    private readonly metricsService: MetricsService,
  ) {}

  // roomId: 방 링크의 방 ID. 초대코드 입장은 EnterRoomByInviteCodeService가 roomId로 바꿔 넘긴다
  // participantId는 로그인 세션의 값이다. 같은 세션이 다시 입장하면 기존 참가자를 돌려준다.
  joinRoom(roomId: string, participantId: string): JoinRoomResponse {
    const room = this.roomQueryService.findExistingRoom(roomId);

    const existingParticipant = room.participants.get(participantId);
    if (existingParticipant) {
      return {
        participant: {
          id: existingParticipant.id,
          nickname: existingParticipant.nickname,
        },
        room: RoomDto.fromEntity(room),
      };
    }

    let nickname: string;
    do {
      nickname = this.generateRandomNickname();
    } while (room.hasNickname(nickname));

    const joinedAt = new Date().toISOString();
    const participant = Participant.create(participantId, nickname, joinedAt);
    // 입장하면 빈 방이 된 시각이 지워지므로 먼저 읽는다
    const secondsSinceEmptied = room.secondsSinceEmptied(this.clock.now());
    room.join(participant);

    this.roomRepository.save(room);
    this.timerScheduler.cancel(TimerKey.roomDeletion(roomId));
    this.roomPresenceTracker.registerPendingParticipant(roomId, participant.id);
    if (secondsSinceEmptied !== undefined) {
      this.metricsService.recordEmptyRoomReturn(secondsSinceEmptied);
    }

    return {
      participant: { id: participant.id, nickname: participant.nickname },
      room: RoomDto.fromEntity(room),
    };
  }

  private generateRandomNickname(): string {
    const adjective =
      NICKNAME_ADJECTIVES[
        Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)
      ];

    return `${adjective}토마토`;
  }
}
