import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { SseService } from './sse.service';
import { SendChatMessageResponse } from '../dto/send-chat-message-response.dto';
import type { ChatMessage } from '../domain/chat-message.entity';

export interface SendChatMessageCommand {
  roomId: string;
  participantId: string;
  clientMessageId: string;
  content: string;
}

@Injectable()
export class SendChatMessageService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly sseService: SseService,
    private readonly clock: Clock,
  ) {}

  // 재전송이면 저장·알림 없이 처음 저장된 메시지를 돌려준다
  sendChatMessage(command: SendChatMessageCommand): ChatMessage {
    const room = this.roomQueryService.findExistingRoom(command.roomId);

    const { message, isResend } = room.sendChatMessage(command.participantId, {
      clientMessageId: command.clientMessageId,
      content: command.content,
      sentAt: this.clock.now().toISOString(),
    });
    if (isResend) {
      return message;
    }

    this.roomRepository.save(room);
    this.sseService.emit(command.roomId, {
      type: 'chat_message',
      data: SendChatMessageResponse.from(message),
    });

    return message;
  }
}
