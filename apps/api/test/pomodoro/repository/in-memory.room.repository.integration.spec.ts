import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';

function restoreRoom(roomId: string, participantIds: string[]): Room {
  return Room.restore({
    roomId,
    participants: participantIds.map((id) =>
      Participant.restore({
        id,
        nickname: id,
        statusMessage: '',
        completedCycles: 0,
        joinedAt: '2026-11-26T00:00:00.000Z',
      }),
    ),
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

describe('InMemoryRoomRepository', () => {
  describe('findByParticipantId', () => {
    it('여러 방 중 그 참여자가 있는 방을 참여자 ID로 찾는다', () => {
      // given
      const roomRepository = new InMemoryRoomRepository();
      roomRepository.save(restoreRoom('room-1', ['other-1']));
      roomRepository.save(restoreRoom('room-2', ['other-2', 'participant-1']));
      roomRepository.save(restoreRoom('room-3', []));

      // when
      const foundRoom = roomRepository.findByParticipantId('participant-1');

      // then
      expect(foundRoom?.roomId).toBe('room-2');
    });
  });
});
