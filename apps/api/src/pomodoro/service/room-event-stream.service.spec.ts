import { NEVER, Subject, firstValueFrom } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { RoomEventStreamService } from './room-event-stream.service';
import { SseService } from './sse.service';
import { RoomPresenceService } from './room-presence.service';
import { RoomQueryService } from './room-query.service';
import { Room } from '../domain/room.entity';

describe('RoomEventStreamService.streamEvents', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';

  const room = {} as unknown as Room;
  const roomSnapshot = {
    roomId,
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
    timer: {},
    participants: [],
  };
  const roomStateEvent = { type: 'room_state' as const, data: roomSnapshot };

  let findExistingRoom: jest.Mock;
  let toRoom: jest.Mock;
  let roomQueryService: RoomQueryService;

  let confirmParticipant: jest.Mock;
  let roomPresenceService: RoomPresenceService;

  let subscribe: jest.Mock;
  let emit: jest.Mock;
  let createMessageEvent: jest.Mock;
  let sseService: SseService;

  let service: RoomEventStreamService;

  beforeEach(() => {
    findExistingRoom = jest.fn().mockReturnValue(room);
    toRoom = jest.fn().mockReturnValue(roomSnapshot);
    roomQueryService = {
      findExistingRoom,
      toRoom,
    } as unknown as RoomQueryService;

    confirmParticipant = jest.fn();
    roomPresenceService = {
      confirmParticipant,
    } as unknown as RoomPresenceService;

    subscribe = jest.fn();
    emit = jest.fn();
    createMessageEvent = jest.fn();
    sseService = {
      subscribe,
      emit,
      createMessageEvent,
    } as unknown as SseService;

    service = new RoomEventStreamService(
      sseService,
      roomPresenceService,
      roomQueryService,
    );
  });

  it('최초로 확정된 참가자의 스트림을 요청하면 방 전체에 최신 상태가 즉시 브로드캐스트된다', () => {
    // given
    confirmParticipant.mockReturnValue({ isNewlyConfirmed: true });
    subscribe.mockReturnValue(NEVER);

    // when
    // 구독 여부와 무관하게, streamEvents() 호출 자체가 브로드캐스트를 트리거해야 한다.
    // (구독 시점에 브로드캐스트하는 방식은 구독이 완전히 연결되기 전에 실행돼
    //  본인이 자기 방송을 못 받는 문제가 있어서 이렇게 바꿨다 — 아래 테스트로 검증)
    service.streamEvents(roomId, participantId);

    // then
    expect(emit).toHaveBeenCalledWith(roomId, roomStateEvent);
  });

  it('최초로 확정된 참가자 본인도 자신의 스트림에서 최신 상태를 받는다', async () => {
    // given
    confirmParticipant.mockReturnValue({ isNewlyConfirmed: true });
    subscribe.mockReturnValue(NEVER);
    const personalMessageEvent = {
      type: 'room_state',
      data: roomSnapshot,
    } as unknown as MessageEvent;
    createMessageEvent.mockReturnValue(personalMessageEvent);

    // when
    const received = await firstValueFrom(
      service.streamEvents(roomId, participantId),
    );

    // then
    expect(received).toBe(personalMessageEvent);
  });

  it('재연결/재사용된 참가자는 방송을 트리거하지 않는다', () => {
    // given
    confirmParticipant.mockReturnValue({ isNewlyConfirmed: false });
    subscribe.mockReturnValue(NEVER);
    createMessageEvent.mockReturnValue({
      type: 'room_state',
      data: roomSnapshot,
    });

    // when
    service.streamEvents(roomId, participantId);

    // then
    expect(emit).not.toHaveBeenCalled();
  });

  it('재연결/재사용된 참가자는 개인 전용 스냅샷만 받고, 방 전체에 브로드캐스트되지 않는다', async () => {
    // given
    confirmParticipant.mockReturnValue({ isNewlyConfirmed: false });
    subscribe.mockReturnValue(NEVER);
    const personalMessageEvent = {
      type: 'room_state',
      data: roomSnapshot,
    } as unknown as MessageEvent;
    createMessageEvent.mockReturnValue(personalMessageEvent);

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
    confirmParticipant.mockReturnValue({ isNewlyConfirmed: false });
    createMessageEvent.mockReturnValue({
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
