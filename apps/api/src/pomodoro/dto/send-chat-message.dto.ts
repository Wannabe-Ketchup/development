import type { SendChatMessageRequest } from '@pomodoro/shared';
import { IsString, IsUUID } from 'class-validator';

// 형식만 검사한다. 길이·줄바꿈·공백은 ChatMessage가 검사한다
export class SendChatMessageDto implements SendChatMessageRequest {
  // 긴 문자열로 메모리를 쓰게 하지 못하도록 UUID만 받는다
  @IsUUID()
  clientMessageId: string;

  @IsString()
  content: string;
}
