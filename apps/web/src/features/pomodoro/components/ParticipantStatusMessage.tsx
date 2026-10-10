import { type KeyboardEvent } from 'react';
import { WobblySpeechBubble } from '@squiggle-line/react';
import EditIcon from '@/assets/edit.svg?react';
import OkIcon from '@/assets/ok.svg?react';
import { cn } from '@/lib/cn';
import { useStatusMessageEditor } from '../hooks/useStatusMessageEditor';

interface ParticipantStatusMessageProps {
  roomId: string;
  participantId: string;
  message: string;
  isSelf: boolean;
}

export function ParticipantStatusMessage({
  roomId,
  participantId,
  message,
  isSelf,
}: ParticipantStatusMessageProps) {
  const {
    value: statusMessage,
    draft,
    error,
    startEditing,
    changeDraft,
    cancelEditing,
    confirmEditing,
  } = useStatusMessageEditor({ roomId, participantId, statusMessage: message });

  const isEmpty = !statusMessage;
  const isEditing = draft !== null;

  if (!isSelf && isEmpty) {
    return null;
  }

  const displayMessage =
    isEmpty && !isEditing ? '지금 무엇을\n하고있나요?' : statusMessage;

  const textColor = isEmpty && !isEditing ? 'text-gray' : 'text-black';
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
    <div className="group relative inline-flex flex-col items-center">
      <WobblySpeechBubble
        key={isEditing ? 'edit' : 'view'}
        className={cn(
          'text-2xl whitespace-pre',
          textColor,
          error && 'animate-shake',
        )}
        pathClassName={cn(
          'fill-white',
          isEmpty || isEditing ? 'stroke-gray' : 'stroke-black',
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
            className="field-sizing-content min-w-0 bg-transparent text-center outline-none"
          />
        ) : (
          displayMessage
        )}
      </WobblySpeechBubble>

      {isSelf &&
        (!isEditing ? (
          <button
            type="button"
            onClick={startEditing}
            className={cn(
              'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 rounded-full p-2 text-white',
              'opacity-0 group-hover:opacity-100',
              buttonBg,
            )}
          >
            <EditIcon />
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={confirmEditing}
            className={cn(
              'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 rounded-full p-2',
              buttonBg,
            )}
          >
            <OkIcon className="size-4 text-white" />
          </button>
        ))}

      {error && (
        <p
          role="alert"
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
