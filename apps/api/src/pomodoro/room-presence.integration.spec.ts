import type { MessageEvent } from '@nestjs/common';
import type { Room as RoomSnapshot } from '@pomodoro/shared';
import { RoomPresenceService } from './service/room-presence.service';
import { SseService } from './service/sse.service';
import { RoomRepository } from './repository/room.repository';
import { Room } from './domain/room.entity';

describe('RoomPresenceService + SseService 통합', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';

  let leave: jest.Mock;
  let room: Room;
  let roomRepository: RoomRepository;

  let presenceService: RoomPresenceService;
  let sseService: SseService;

  const emitRoomState = () =>
    sseService.emit(roomId, {
      type: 'room_state',
      data: {} as unknown as RoomSnapshot,
    });

  const subscribeAndCollect = (): MessageEvent[] => {
    const received: MessageEvent[] = [];
    sseService.subscribe(roomId).subscribe((event) => received.push(event));
    return received;
  };

  beforeEach(() => {
    jest.useFakeTimers();

    leave = jest.fn();
    room = { leave } as unknown as Room;
    roomRepository = {
      findById: jest.fn().mockReturnValue(room),
      save: jest.fn(),
      delete: jest.fn(),
    };

    presenceService = new RoomPresenceService(roomRepository);
    sseService = new SseService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('참가자가 SSE로 처음 연결(확정)하면 방 전체에 최신 상태가 브로드캐스트된다', () => {
    // given
    presenceService.registerPendingParticipant(roomId, participantId);
    const received = subscribeAndCollect();

    // when
    const { isNewlyConfirmed } = presenceService.confirmParticipant(
      roomId,
      participantId,
    );
    if (isNewlyConfirmed) {
      emitRoomState();
    }

    // then
    expect(received).toHaveLength(1);
  });

  it('5초 안에 확정되지 않은 참가자는 아무에게도 알려지지 않고 조용히 방에서 제거된다', () => {
    // given
    presenceService.registerPendingParticipant(roomId, participantId);
    const received = subscribeAndCollect();

    // when
    jest.advanceTimersByTime(5000);

    // then
    expect(received).toHaveLength(0);
    expect(leave).toHaveBeenCalledWith(participantId);
  });

  it('이미 확정된 참가자가 재연결해도 다른 참가자에게는 다시 알려지지 않는다', () => {
    // given
    presenceService.registerPendingParticipant(roomId, participantId);
    presenceService.confirmParticipant(roomId, participantId); // 최초 확정
    const received = subscribeAndCollect(); // 이후 구독 시작

    // when
    const { isNewlyConfirmed } = presenceService.confirmParticipant(
      roomId,
      participantId,
    ); // 재연결
    if (isNewlyConfirmed) {
      emitRoomState();
    }

    // then
    expect(received).toHaveLength(0);
  });
});
