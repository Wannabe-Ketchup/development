import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from '@pomodoro/shared';
import type { SendChatMessageFailureReason } from '@/api/chat';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import type { SendChatMessageState } from '../hooks/useChatMessageForm';
import { useStickToBottom } from '../hooks/useStickToBottom';
import { ChatMessageItem } from './ChatMessageItem';

// 테두리만 그리고 배경은 안쪽 요소에 칠한다(Modal과 같은 이유)
const PANEL_WOBBLY = {
  wiggle: 2,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 3,
  borderRadius: 20,
  pathClassName: 'fill-none stroke-black',
};
const INPUT_WOBBLY = {
  wiggle: 10,
  frequency: 360,
  smoothen: 12,
  strokeWidth: 2,
  borderRadius: 999,
  pathClassName: 'fill-white stroke-black',
};
// squiggle의 흔들림은 도형의 짧은 변에 비례해 선에는 생기지 않으므로 완만한 곡선을 직접 그린다
const DIVIDER_PATH = 'M 1 3 C 33 5 65 4 103 3 S 173 1 206 2 S 276 4 307 3';

const FAILURE_MESSAGE: Record<SendChatMessageFailureReason, string> = {
  'rate-limited': '너무 자주 보냈어요. 잠시 후 다시 보내 주세요',
  unknown: '보내지 못했어요. 다시 시도해 주세요',
};

interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  selfParticipantId: string;
  draft: string;
  sendState: SendChatMessageState;
  canSend: boolean;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
  onClose: () => void;
}

// 열어 둔 채 방을 조작할 수 있어야 해서 Modal을 쓰지 않는다(showModal은 뒤 화면을 막는다).
// 1440px 화면에 4명이 있으면 조명이 가려진다. 더 넓히면 참여자를 많이 가린다
export function ChatPanel({
  isOpen,
  messages,
  selfParticipantId,
  draft,
  sendState,
  canSend,
  onDraftChange,
  onSend,
  onClose,
}: ChatPanelProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const { scrollRef, contentRef, handleScroll, stickToBottom } =
    useStickToBottom<HTMLDivElement, HTMLUListElement>();

  // 닫을 때도 맨 아래로 보내, 닫힌 동안 온 메시지가 보일 자리에서 미리 그려지게 한다
  useEffect(() => {
    stickToBottom();
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, stickToBottom]);

  // 한글 조합 중의 Esc는 조합을 취소하는 키라 닫지 않는다
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) onClose();
  };

  return (
    <WobblyBox {...PANEL_WOBBLY}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- 안쪽 입력창·버튼의 Esc를 모아 처리한다 */}
      <section
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="flex h-86 w-70 flex-col rounded-[20px] bg-cream px-3 pt-2.5 pb-3 font-(family-name:--font-ongleipryudung) tracking-[5%] [-webkit-text-stroke:0.5px_currentColor]"
      >
        <div className="flex items-center justify-between pb-1.5">
          <h2 id={titleId} className="text-title-sm leading-[normal]">
            채팅
          </h2>
          <IconButton
            label="채팅 닫기"
            icon={CloseSvg}
            onClick={onClose}
            iconClassName="size-5"
            className="flex size-5 items-center justify-center"
          />
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 308 6"
          preserveAspectRatio="none"
          className="h-1.5 w-64 shrink-0 fill-none stroke-black stroke-2"
        >
          <path d={DIVIDER_PATH} strokeLinecap="round" />
        </svg>
        <div
          ref={scrollRef}
          role="log"
          onScroll={handleScroll}
          className="-mx-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-0.5"
        >
          <ul ref={contentRef} className="flex flex-col">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isMine={message.senderId === selfParticipantId}
              />
            ))}
          </ul>
        </div>
        {sendState.status === 'failed' && (
          <p role="alert" className="pt-1 text-caption leading-none text-error">
            {FAILURE_MESSAGE[sendState.reason]}
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
            stickToBottom();
            // 보내기를 클릭했어도 이어서 칠 수 있게 입력창으로 돌려보낸다
            inputRef.current?.focus();
          }}
          className="flex items-center gap-2.5 pt-1.5"
        >
          <WobblyBox {...INPUT_WOBBLY} className="min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              aria-label="메시지"
              value={draft}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              placeholder="토마토들에게 말 걸기..."
              autoComplete="off"
              readOnly={sendState.status === 'sending'}
              onChange={(event) => onDraftChange(event.target.value)}
              className="relative h-8 w-full bg-transparent px-2.5 text-body-sm outline-none placeholder:text-warm-gray"
            />
          </WobblyBox>
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 text-body-sm text-tomato-body-4 disabled:cursor-default disabled:opacity-50"
          >
            보내기
          </button>
        </form>
      </section>
    </WobblyBox>
  );
}
