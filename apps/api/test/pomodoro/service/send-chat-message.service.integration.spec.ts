import type { MessageEvent } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
} from '@pomodoro/shared';
import { Clock } from '../../../src/common/clock/clock';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { SendChatMessageService } from '../../../src/pomodoro/service/send-chat-message.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { ChatMessage } from '../../../src/pomodoro/domain/chat-message.entity';
import { ChatMessages } from '../../../src/pomodoro/domain/chat-messages';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const NOW = new Date('2026-11-21T10:00:00.000Z');
const ROOM_ID = 'room-1';
const PARTICIPANT_ID = 'participant-1';
const CLIENT_MESSAGE_ID = '00000000-0000-4000-8000-000000000001';

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

function roomWithParticipant(chatMessages?: ChatMessages): Room {
  return Room.restore({
    roomId: ROOM_ID,
    participants: [
      Participant.restore({
        id: PARTICIPANT_ID,
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: '2026-11-21T09:50:00.000Z',
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
    chatMessages,
  });
}

describe('SendChatMessageService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    })
      .overrideProvider(Clock)
      .useClass(FixedClock)
      .compile();
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('sendChatMessage', () => {
    it('메시지를 보내면 서버 시각과 함께 저장소의 방에 남는다', () => {
      // given
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(roomWithParticipant());

      // when
      moduleRef.get(SendChatMessageService).sendChatMessage({
        roomId: ROOM_ID,
        participantId: PARTICIPANT_ID,
        clientMessageId: CLIENT_MESSAGE_ID,
        content: '안녕하세요',
      });

      // then
      const savedMessages = roomRepository
        .findById(ROOM_ID)
        ?.chatMessagesSinceJoined(PARTICIPANT_ID);
      expect(savedMessages).toHaveLength(1);
      expect(savedMessages?.[0]).toMatchObject({
        content: '안녕하세요',
        sentAt: NOW.toISOString(),
      });
    });

    it('메시지를 보내면 방 구독자에게 clientMessageId를 뺀 메시지가 chat_message로 전달된다', () => {
      // given
      moduleRef.get(RoomRepository).save(roomWithParticipant());
      const published: MessageEvent[] = [];
      moduleRef
        .get(SseService)
        .subscribe(ROOM_ID)
        .subscribe((event) => published.push(event));

      // when
      moduleRef.get(SendChatMessageService).sendChatMessage({
        roomId: ROOM_ID,
        participantId: PARTICIPANT_ID,
        clientMessageId: CLIENT_MESSAGE_ID,
        content: '안녕하세요',
      });

      // then
      expect(published).toHaveLength(1);
      expect(published[0].type).toBe('chat_message');
      expect(published[0].data).toEqual({
        id: 1,
        senderId: PARTICIPANT_ID,
        nickname: '케첩',
        content: '안녕하세요',
        sentAt: NOW.toISOString(),
      });
    });

    it('이미 저장된 메시지를 다시 보내면 방 구독자에게 다시 전달하지 않는다', () => {
      // given
      const chatMessages = ChatMessages.restore({
        messages: [
          ChatMessage.restore({
            id: 1,
            senderId: PARTICIPANT_ID,
            clientMessageId: CLIENT_MESSAGE_ID,
            nickname: '케첩',
            content: '안녕하세요',
            sentAt: '2026-11-21T09:59:59.000Z',
          }),
        ],
        nextId: 2,
      });
      moduleRef.get(RoomRepository).save(roomWithParticipant(chatMessages));
      const published: MessageEvent[] = [];
      moduleRef
        .get(SseService)
        .subscribe(ROOM_ID)
        .subscribe((event) => published.push(event));

      // when
      moduleRef.get(SendChatMessageService).sendChatMessage({
        roomId: ROOM_ID,
        participantId: PARTICIPANT_ID,
        clientMessageId: CLIENT_MESSAGE_ID,
        content: '안녕하세요',
      });

      // then
      expect(published).toHaveLength(0);
    });
  });
});
