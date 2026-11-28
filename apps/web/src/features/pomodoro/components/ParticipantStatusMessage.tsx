import { useState, type KeyboardEvent } from 'react';
import { WobblySpeechBubble } from '@squiggle-line/react';
import EditIcon from '@/assets/edit.svg?react';
import OkIcon from '@/assets/ok.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';
import { useCoversTimer } from '../hooks/useCoversTimer';
import { usePreventDragSelection } from '../hooks/usePreventDragSelection';
import { useStatusMessageEditor } from '../hooks/useStatusMessageEditor';

const BREAK_STATUS_MESSAGE = '휴식 중…';

// 좁은 화면(compact-safe-area 안)에서는 보이는 크기는 그대로 두고 누르는 영역만 넓힌다
const COMPACT_TOUCH_CLASS_NAME =
  "in-[.compact-safe-area]:after:absolute in-[.compact-safe-area]:after:-inset-2 in-[.compact-safe-area]:after:content-['']";

interface ParticipantStatusMessageProps {
  roomId: string;
  message: string;
  isSelf: boolean;
  isBreak: boolean;
  // 폰은 자리표시 문구를 한 줄로 보여 준다(넓은 화면은 두 줄)
  hasOneLinePlaceholder?: boolean;
  className?: string;
}

export function ParticipantStatusMessage({
  roomId,
  message,
  isSelf,
  isBreak,
  hasOneLinePlaceholder = false,
  className,
}: ParticipantStatusMessageProps) {
  const {
    value: statusMessage,
    draft,
    error,
    startEditing,
    changeDraft,
    cancelEditing,
    confirmEditing,
  } = useStatusMessageEditor({ roomId, statusMessage: message });
  const { isPointerDown, onPointerDown } = usePreventDragSelection();
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const isCoveringTimer = useCoversTimer(rootElement);

  const isEmpty = !statusMessage;
  const isEditing = draft !== null;
  // 고치던 중에 휴식이 시작되면 입력하던 내용을 마저 저장할 수 있게 입력창을 유지한다
  const isShowingBreak = isBreak && !isEditing;
  const isPlaceholder = isEmpty && !isEditing && !isShowingBreak;
  const canStartEditing = isSelf && !isBreak && !isEditing;

  if (!isSelf && isEmpty && !isShowingBreak) {
    return null;
  }

  const displayMessage = (() => {
    if (isShowingBreak) return BREAK_STATUS_MESSAGE;
    if (isPlaceholder)
      return hasOneLinePlaceholder
        ? '지금 무엇을 하고있나요?'
        : '지금 무엇을\n하고있나요?';
    return statusMessage;
  })();

  const textColor = isPlaceholder ? 'text-gray' : 'text-black';
  const buttonBg = isEmpty || isEditing ? 'bg-gray/40' : 'bg-black/60';

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmEditing();
    }
    if (event.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleBlur = () => {
    if (!document.hasFocus()) return;
    cancelEditing();
  };

  return (
    <div
      ref={setRootElement}
      data-tour-id={isSelf ? 'self-status' : undefined}
      className={cn(
        'group relative inline-flex flex-col items-center',
        // 화면이 낮아 타이머와 겹치면 숨긴다. 고치는 중에는 입력이 사라지지 않게 그대로 둔다
        isCoveringTimer && !isEditing && 'invisible',
        className,
      )}
    >
      <WobblySpeechBubble
        key={isEditing ? 'edit' : 'view'}
        className={cn(
          // 데스크톱 24, 좁은 화면 22. 닉네임과 같은 크기다
          'font-ongleipryudung text-title whitespace-pre in-[.compact-safe-area]:text-title-sm',
          textColor,
          error && 'animate-shake',
        )}
        pathClassName={cn(
          'fill-white',
          isPlaceholder || isEditing ? 'stroke-gray' : 'stroke-black',
        )}
        frequency={500}
        wiggle={5}
        smoothen={12}
        tailHeight={24}
        strokeWidth={3}
        tailType="dot"
        padding={12}
      >
        {isEditing ? (
          <input
            autoFocus
            aria-label="상태메시지 입력"
            value={draft}
            onChange={(e) => changeDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPointerDown={onPointerDown}
            className={cn(
              'field-sizing-content min-w-0 bg-transparent text-center outline-none',
              isPointerDown && 'selection:bg-transparent',
            )}
          />
        ) : (
          displayMessage
        )}
      </WobblySpeechBubble>

      {canStartEditing && (
        <IconButton
          label="상태 메시지 수정"
          icon={EditIcon}
          onClick={startEditing}
          className={cn(
            'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 rounded-full p-2 text-white',
            COMPACT_TOUCH_CLASS_NAME,
            'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100',
            'group-focus-within:opacity-100',
            buttonBg,
          )}
        />
      )}
      {isEditing && (
        <IconButton
          label="상태 메시지 확인"
          icon={OkIcon}
          iconClassName="size-4 text-white"
          onMouseDown={(e) => e.preventDefault()}
          onClick={confirmEditing}
          className={cn(
            'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 rounded-full p-2',
            COMPACT_TOUCH_CLASS_NAME,
            buttonBg,
          )}
        />
      )}

      {error && (
        <p
          role="alert"
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-caption whitespace-nowrap text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
