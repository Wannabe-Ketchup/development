import { WobblyBox } from '@squiggle-line/react';
import type { ChatMessage } from '@pomodoro/shared';
import { cn } from '@/lib/cn';
import { formatChatTime } from '../lib/chat-time';

const BUBBLE_WOBBLY = {
  wiggle: 10,
  frequency: 360,
  smoothen: 12,
  strokeWidth: 2,
  borderRadius: 8,
};

interface ChatMessageItemProps {
  message: ChatMessage;
  isMine: boolean;
}

export function ChatMessageItem({ message, isMine }: ChatMessageItemProps) {
  return (
    // 말풍선 선 계산이 무거워, 보이는 곳에서 먼 말풍선은 가까워질 때까지 크기 측정과 선 계산을 미룬다(content-visibility).
    // 채팅창을 숨겨 두어도 새로고침 등으로 chat_history를 한꺼번에 받으면 화면이 멈추기 때문이다.
    // 이때 li 밖으로 나간 그림은 잘리므로, 테두리가 흔들려 나가는 만큼 li 안쪽에 여백을 둔다
    <li
      className={cn(
        'flex flex-col gap-1 px-2 py-1 [contain-intrinsic-size:auto_58px] [content-visibility:auto]',
        isMine ? 'items-end' : 'items-start',
      )}
    >
      <p className="max-w-full text-caption leading-none break-all text-warm-gray-dark">
        {isMine ? '나' : message.nickname}
        <time dateTime={message.sentAt} className="ml-2 text-warm-gray">
          {formatChatTime(message.sentAt)}
        </time>
      </p>
      <WobblyBox
        {...BUBBLE_WOBBLY}
        pathClassName={cn(
          'stroke-black',
          isMine ? 'fill-tomato-pale' : 'fill-white',
        )}
        className="max-w-[85%]"
      >
        {/* relative여야 말풍선 채우기가 글자를 덮지 않는다 */}
        <p className="relative px-3 py-1 text-body-sm wrap-anywhere break-keep whitespace-pre-wrap">
          {message.content}
        </p>
      </WobblyBox>
    </li>
  );
}
