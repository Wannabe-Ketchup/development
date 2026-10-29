import { ROOM_MODE } from '@pomodoro/shared';
import { RoomDto } from '../../../src/pomodoro/dto/../../../src/pomodoro/dto/room.dto';
import { Room } from '../../../src/pomodoro/dto/../domain/room.entity';
import { Participant } from '../../../src/pomodoro/dto/../domain/participant.entity';

describe('RoomDto.fromEntity', () => {
  it('방 도메인을 공유 타입 스냅샷으로 변환하면 참가자 목록이 배열로 변환된다', () => {
    // given
    const participant1 = {
      id: '1',
      nickname: 'a',
      statusMessage: '',
      completedCycles: 0,
    } as unknown as Participant;
    const participant2 = {
      id: '2',
      nickname: 'b',
      statusMessage: '',
      completedCycles: 0,
    } as unknown as Participant;
    const room = {
      roomId: 'room-1',
      mode: ROOM_MODE.FOCUS,
      currentCycle: 2,
      timer: { status: 'RUNNING' },
      participants: new Map([
        [participant1.id, participant1],
        [participant2.id, participant2],
      ]),
    } as unknown as Room;

    // when
    const result = RoomDto.fromEntity(room);

    // then
    expect(result).toEqual({
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [
        {
          id: participant1.id,
          nickname: participant1.nickname,
          statusMessage: participant1.statusMessage,
          completedCycles: participant1.completedCycles,
        },
        {
          id: participant2.id,
          nickname: participant2.nickname,
          statusMessage: participant2.statusMessage,
          completedCycles: participant2.completedCycles,
        },
      ],
    });
  });
});
