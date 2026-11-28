import { useEffect, useId, useRef, useState } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from '@pomodoro/shared';
import type { SendChatMessageFailureReason } from '@/api/chat';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import {
  readVisualViewportRect,
  useVisualViewportRect,
} from '@/hooks/useVisualViewportRect';
import { cn } from '@/lib/cn';
import type { CompactLayout } from '@/lib/viewport-mode';
import type { SendChatMessageState } from '../../hooks/useChatMessageForm';
import { useStickToBottom } from '../../hooks/useStickToBottom';
import {
  getSheetHeightPx,
  getSheetTopPx,
  isKeyboardOpen as getIsKeyboardOpen,
} from '../../lib/chat-sheet-layout';
import { ChatMessageItem } from '../ChatMessageItem';

const SHEET_WOBBLY = {
  wiggle: 2,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 3,
  borderRadius: 24,
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
const DIVIDER_PATH = 'M 1 3 C 33 5 65 4 103 3 S 173 1 206 2 S 276 4 307 3';

const FAILURE_MESSAGE: Record<SendChatMessageFailureReason, string> = {
  'rate-limited': '너무 자주 보냈어요. 잠시 후 다시 보내 주세요',
  unknown: '보내지 못했어요. 다시 시도해 주세요',
};

// 시트 아래쪽 둥근 모서리를 화면 밖으로 밀어 위쪽만 둥글게 보이게 한다
const HIDDEN_BOTTOM_PX = 24;
// 중간 화면에서 시트가 너무 넓어지지 않게 한다
const TABLET_MAX_WIDTH_CLASS = 'max-w-140';

interface ChatSheetProps {
  layout: CompactLayout;
  messages: ChatMessage[];
  selfParticipantId: string;
  draft: string;
  sendState: SendChatMessageState;
  canSend: boolean;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
  onClose: () => void;
}

// 좁은 화면의 채팅창. 아래에서 올라오는 시트이고 X·바깥·아래로 끌기·Esc로 닫는다.
// 열린 동안 뒤 화면은 모달이라 막히고 스크롤도 잠긴다.
// 실제로 보이는 영역(visualViewport)에 맞춰 놓는다. 윗면은 화면 높이의 25% 아래에 두고,
// 키보드가 올라오면 메시지 목록만 줄어 입력창이 키보드 위에 붙는다. 시트는 키보드 뒤까지 이어진다.
// 열 때만 마운트한다. 쓰던 내용은 useChat이 들고 있다
export function ChatSheet({
  layout,
  messages,
  selfParticipantId,
  draft,
  sendState,
  canSend,
  onDraftChange,
  onSend,
  onClose,
}: ChatSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewport = useVisualViewportRect();
  // 연 순간(키보드가 올라오기 전)의 보이는 높이. 윗면 위치와 키보드 판단의 기준이다
  const [openedVisibleHeight] = useState(() => readVisualViewportRect().height);
  const sheetTopPx = getSheetTopPx(openedVisibleHeight);
  const isKeyboardOpen = getIsKeyboardOpen(
    viewport.height,
    openedVisibleHeight,
  );
  const sheetHeightPx = getSheetHeightPx(viewport.height, sheetTopPx);
  // 키보드가 가린 높이. 시트를 키보드 뒤까지 늘려, 반투명한 키보드·주소 알약 뒤로 시트가 비치게 한다
  const keyboardInsetPx = viewport.bottomInset;

  const { scrollRef, contentRef, handleScroll, stickToBottom } =
    useStickToBottom<HTMLDivElement, HTMLUListElement>();

  // 마운트되면 모달로 연다. StrictMode 이중 실행 대비로 open을 확인한다
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    stickToBottom();
    inputRef.current?.focus({ preventScroll: true });
  }, [stickToBottom]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // 어두운 막은 키보드 뒤까지 화면 전체를 덮는다(iOS 26 키보드는 반투명이라 뒤가 비친다)
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden bg-black/30 p-0 select-none"
      onClose={onClose}
    >
      {/* 시트는 보이는 영역에 맞춘다. iOS가 입력창을 보이게 하려고 화면을 밀어도 따라간다.
          바깥(어두운 막)을 누르면 닫는다 */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- 바깥 클릭 닫기. 키보드는 dialog 기본 Esc가 담당 */}
      <div
        className="absolute inset-x-0 flex items-end justify-center"
        style={{
          top: viewport.top,
          height: viewport.height + keyboardInsetPx,
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <WobblyBox
          {...SHEET_WOBBLY}
          className={cn(
            'w-full',
            layout === 'tablet' && TABLET_MAX_WIDTH_CLASS,
          )}
          style={{
            height: sheetHeightPx + keyboardInsetPx + HIDDEN_BOTTOM_PX,
            marginBottom: -HIDDEN_BOTTOM_PX,
          }}
        >
          <section
            aria-labelledby={titleId}
            className="flex h-full w-full flex-col rounded-3xl bg-cream px-5 pt-4"
            style={{
              // 입력창은 키보드 바로 위(보이는 영역 아래 끝)에 둔다
              paddingBottom: isKeyboardOpen
                ? HIDDEN_BOTTOM_PX + 8 + keyboardInsetPx
                : `calc(${HIDDEN_BOTTOM_PX + 8}px + var(--safe-bottom, 0px))`,
            }}
          >
            <div className="flex h-12 shrink-0 items-center justify-between">
              <h2 id={titleId} className="text-title-sm leading-[normal]">
                채팅
              </h2>
              <IconButton
                label="채팅 닫기"
                icon={CloseSvg}
                iconClassName="size-6"
                onClick={onClose}
                className="-mr-3 flex size-12 items-center justify-center"
              />
            </div>
            <svg
              aria-hidden="true"
              viewBox="0 0 308 6"
              preserveAspectRatio="none"
              className="h-1.5 w-full shrink-0 fill-none stroke-black stroke-2"
            >
              <path d={DIVIDER_PATH} strokeLinecap="round" />
            </svg>
            <div
              ref={scrollRef}
              role="log"
              onScroll={handleScroll}
              className="-mx-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain py-1"
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
              <p
                role="alert"
                className="pt-1.5 text-caption leading-none text-error"
              >
                {FAILURE_MESSAGE[sendState.reason]}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSend();
                stickToBottom();
                // 보내기를 눌러도 키보드가 내려가지 않게 입력창으로 돌려보낸다
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="flex shrink-0 items-center gap-1 pt-2"
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
                  // iOS Safari는 입력창을 눌러 포커스하면 키보드에 가리지 않게 화면 전체를 위로 민다.
                  // 처음 누를 때는 기본 포커스를 막고 화면을 움직이지 않는 포커스를 직접 준다. 시트는 보이는 영역을 따라 키보드 위로 올라온다.
                  // 이미 포커스가 있으면 커서 이동·선택 같은 기본 동작을 그대로 둔다
                  onTouchEnd={(event) => {
                    if (document.activeElement === event.currentTarget) return;
                    event.preventDefault();
                    event.currentTarget.focus({ preventScroll: true });
                  }}
                  // iOS는 글자 크기가 16px보다 작은 입력창에 포커스하면 화면을 확대한다
                  className="relative h-11 w-full bg-transparent px-4 text-body-sm outline-none placeholder:text-warm-gray"
                />
              </WobblyBox>
              <button
                type="submit"
                disabled={!canSend}
                className="h-11 shrink-0 px-3 text-body-sm text-tomato-body-4 disabled:cursor-default disabled:opacity-50"
              >
                보내기
              </button>
            </form>
          </section>
        </WobblyBox>
      </div>
    </dialog>
  );
}
