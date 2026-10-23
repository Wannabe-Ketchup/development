import { NEVER, Subject, firstValueFrom } from 'rxjs';
import { NotFoundException, type MessageEvent } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { RoomEventStreamService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/room-event-stream.service';
import { SseService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/sse.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/../../../src/pomodoro/service/room-presence.tracker';
import { RoomQueryService } from '../../../src/pomodoro/service/../../../src/pomodoro/service/room-query.service';
import { RoomDto } from '../../../src/pomodoro/service/../dto/room.dto';
import { Room } from '../../../src/pomodoro/service/../domain/room.entity';

describe('RoomEventStreamService.streamEvents', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';

  const room = {
    participants: new Map([[participantId, {}]]),
  } as unknown as Room;
  const roomSnapshot = {
    roomId,
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
    timer: {},
    participants: [],
  };
  const roomStateEvent = { type: 'room_state' as const, data: roomSnapshot };

  let findExistingRoom: jest.Mock;
  let roomQueryService: RoomQueryService;

  let connectParticipant: jest.Mock;
  let disconnectParticipant: jest.Mock;
  let roomPresenceTracker: RoomPresenceTracker;

  let subscribe: jest.Mock;
  let emit: jest.Mock;
  let createOwnSnapshotEvent: jest.Mock;
  let sseService: SseService;

  let service: RoomEventStreamService;

  beforeEach(() => {
    findExistingRoom = jest.fn().mockReturnValue(room);
    roomQueryService = {
      findExistingRoom,
    } as unknown as RoomQueryService;
    jest
      .spyOn(RoomDto, 'fromEntity')
      .mockReturnValue(roomSnapshot as unknown as RoomDto);

    connectParticipant = jest.fn();
    disconnectParticipant = jest.fn();
    roomPresenceTracker = {
      connectParticipant,
      disconnectParticipant,
    } as unknown as RoomPresenceTracker;

    subscribe = jest.fn();
    emit = jest.fn();
    createOwnSnapshotEvent = jest.fn();
    sseService = {
      subscribe,
      emit,
      createOwnSnapshotEvent,
    } as unknown as SseService;

    service = new RoomEventStreamService(
      sseService,
      roomPresenceTracker,
      roomQueryService,
    );
  });

  it('방에 존재하지 않는 participantId로 연결을 요청하면 예외를 던진다', () => {
    // when / then
    expect(() =>
      service.streamEvents(roomId, 'not-existing-participant-id'),
    ).toThrow(NotFoundException);
    expect(emit).not.toHaveBeenCalled();
  });

  it('최초로 확정된 참가자의 스트림을 요청하면 방 전체에 최신 상태가 즉시 브로드캐스트된다', () => {
    // given
    connectParticipant.mockReturnValue(true);
    subscribe.mockReturnValue(NEVER);

    // when
    service.streamEvents(roomId, participantId).subscribe();

    // then
    expect(emit).toHaveBeenCalledWith(roomId, roomStateEvent);
  });

  it('최초로 확정된 참가자 본인도 자신의 스트림에서 최신 상태를 받는다', async () => {
    // given
    connectParticipant.mockReturnValue(true);
    subscribe.mockReturnValue(NEVER);
    const personalMessageEvent = {
      type: 'room_state',
      data: roomSnapshot,
    } as unknown as MessageEvent;
    createOwnSnapshotEvent.mockReturnValue(personalMessageEvent);

    // when
    const received = await firstValueFrom(
      service.streamEvents(roomId, participantId),
    );

    // then
    expect(received).toBe(personalMessageEvent);
  });

  it('재연결/재사용된 참가자는 방송을 트리거하지 않는다', () => {
    // given
    connectParticipant.mockReturnValue(false);
    subscribe.mockReturnValue(NEVER);
    createOwnSnapshotEvent.mockReturnValue({
      type: 'room_state',
      data: roomSnapshot,
    });

    // when
    service.streamEvents(roomId, participantId).subscribe();

    // then
    expect(emit).not.toHaveBeenCalled();
  });

  it('재연결/재사용된 참가자는 개인 전용 스냅샷만 받고, 방 전체에 브로드캐스트되지 않는다', async () => {
    // given
    connectParticipant.mockReturnValue(false);
    subscribe.mockReturnValue(NEVER);
    const personalMessageEvent = {
      type: 'room_state',
      data: roomSnapshot,
    } as unknown as MessageEvent;
    createOwnSnapshotEvent.mockReturnValue(personalMessageEvent);

    // when
    const received = await firstValueFrom(
      service.streamEvents(roomId, participantId),
    );

    // then
    expect(received).toBe(personalMessageEvent);
    expect(emit).not.toHaveBeenCalled();
  });

  it('재연결/재사용된 참가자도 그 이후 방에서 발생하는 브로드캐스트는 계속 수신한다', () => {
    // given
    connectParticipant.mockReturnValue(false);
    createOwnSnapshotEvent.mockReturnValue({
      type: 'room_state',
      data: roomSnapshot,
    });
    const roomStream$ = new Subject<MessageEvent>();
    subscribe.mockReturnValue(roomStream$.asObservable());
    const laterEvent = {
      type: 'room_state',
      data: roomSnapshot,
    } as unknown as MessageEvent;

    // when
    const received: MessageEvent[] = [];
    const subscription = service
      .streamEvents(roomId, participantId)
      .subscribe((event) => received.push(event));
    roomStream$.next(laterEvent);

    // then
    expect(received).toEqual([expect.anything(), laterEvent]);
    subscription.unsubscribe();
  });
});
