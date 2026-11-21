import type { MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemClock } from '../../../src/common/clock/system.clock';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type Room as RoomState,
} from '@pomodoro/shared';
import { LeaveRoomService } from '../../../src/pomodoro/service/leave-room.service';
import { RoomEventStreamService } from '../../../src/pomodoro/service/room-event-stream.service';
import { RoomPresenceTracker } from '../../../src/pomodoro/service/room-presence.tracker';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { ChatMessage } from '../../../src/pomodoro/domain/chat-message.entity';
import { ChatMessages } from '../../../src/pomodoro/domain/chat-messages';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

describe('RoomEventStreamService', () => {
  const roomId = 'roomId';
  const participantId = 'A';
  const joinedAt = '2026-09-02T00:00:00.000Z';

  const setUp = () => {
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new RoomEventStreamService(
      sseService,
      new RoomPresenceTracker(
        new LeaveRoomService(
          roomRepository,
          sseService,
          new InMemoryTimerScheduler(new EventEmitter2()),
          new SystemClock(),
        ),
      ),
      new RoomQueryService(roomRepository),
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    return { roomRepository, sseService, service };
  };

  // A는 00:05에 들어왔고, 그 전(1번)과 뒤(2번)에 B가 보낸 메시지가 있다
  const roomWithChatMessages = (): Room =>
    Room.restore({
      roomId,
      participants: [
        Participant.restore({
          id: participantId,
          nickname: '케첩',
          statusMessage: '',
          completedCycles: 0,
          joinedAt: '2026-09-02T00:05:00.000Z',
        }),
        Participant.restore({
          id: 'B',
          nickname: '머스타드',
          statusMessage: '',
          completedCycles: 0,
          joinedAt,
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
      chatMessages: ChatMessages.restore({
        messages: [
          ChatMessage.restore({
            id: 1,
            senderId: 'B',
            clientMessageId: '00000000-0000-4000-8000-000000000001',
            nickname: '머스타드',
            content: '혼자 있네',
            sentAt: '2026-09-02T00:01:00.000Z',
          }),
          ChatMessage.restore({
            id: 2,
            senderId: 'B',
            clientMessageId: '00000000-0000-4000-8000-000000000002',
            nickname: '머스타드',
            content: '어서 오세요',
            sentAt: '2026-09-02T00:06:00.000Z',
          }),
        ],
        nextId: 3,
      }),
    });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('streamEvents', () => {
    it('접속이 끊기고 10초가 지나면 참가자가 방에서 나가고 같은 방에 room_state가 1번 전파된다 (LEAVE-01, LEAVE-02)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const connection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      connection.unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 1;
      const expectedRemainingIds = ['B'];
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(false);
      expect(publishedStates).toHaveLength(expectedPublishCount);
      expect(publishedStates[0].participants.map((p) => p.id)).toEqual(
        expectedRemainingIds,
      );
    });

    it('접속이 끊긴 뒤 10초 안에 다시 접속하면 참가자는 방에 남고 room_state는 전파되지 않는다 (LEAVE-01)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const firstConnection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      firstConnection.unsubscribe();
      jest.advanceTimersByTime(5000);
      service.streamEvents(roomId, participantId).subscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 0;
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(true);
      expect(publishedStates).toHaveLength(expectedPublishCount);
    });

    it('유예 중 다시 접속했다가 또 끊기면 마지막으로 끊긴 때부터 10초 뒤에 room_state가 1번만 전파된다 (LEAVE-01, LEAVE-02)', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      const firstConnection = service
        .streamEvents(roomId, participantId)
        .subscribe();
      const publishedStates: RoomState[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      firstConnection.unsubscribe();
      jest.advanceTimersByTime(5000);
      service.streamEvents(roomId, participantId).subscribe().unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      const expectedPublishCount = 1;
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(false);
      expect(publishedStates).toHaveLength(expectedPublishCount);
    });

    it('같은 참가자의 탭 두 개 중 하나만 닫히면 10초가 지나도 방에 남는다 (LEAVE-01)', () => {
      // given
      const { roomRepository, service } = setUp();
      const firstTab = service.streamEvents(roomId, participantId).subscribe();
      service.streamEvents(roomId, participantId).subscribe();

      // when
      firstTab.unsubscribe();
      jest.advanceTimersByTime(10000);

      // then
      expect(
        roomRepository.findById(roomId)?.participants.has(participantId),
      ).toBe(true);
    });

    it('연결이 열리면 room_state 바로 뒤에 그 참가자가 입장한 뒤의 메시지가 chat_history로 온다', () => {
      // given
      const { roomRepository, service } = setUp();
      roomRepository.save(roomWithChatMessages());
      const received: MessageEvent[] = [];

      // when
      service
        .streamEvents(roomId, participantId)
        .subscribe((event) => received.push(event));

      // then
      expect(received.map(({ type }) => type)).toEqual([
        'room_state',
        'chat_history',
      ]);
      expect(received[1].data).toEqual({
        messages: [
          {
            id: 2,
            senderId: 'B',
            nickname: '머스타드',
            content: '어서 오세요',
            sentAt: '2026-09-02T00:06:00.000Z',
          },
        ],
      });
    });

    it('새로 열린 연결의 chat_history는 같은 방의 다른 연결에 가지 않는다', () => {
      // given
      const { roomRepository, sseService, service } = setUp();
      roomRepository.save(roomWithChatMessages());
      const roomChannel: MessageEvent[] = [];
      sseService
        .subscribe(roomId)
        .subscribe((event) => roomChannel.push(event));

      // when
      service.streamEvents(roomId, participantId).subscribe();

      // then
      expect(roomChannel.map(({ type }) => type)).not.toContain('chat_history');
    });
  });
});
