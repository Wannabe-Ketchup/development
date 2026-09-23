import { type KeyboardEvent } from 'react';
import EditIcon from '@/assets/edit.svg?react';
import OkIcon from '@/assets/ok.svg?react';
import { cn } from '@/lib/cn';
import { useNicknameEditor } from '../hooks/useNicknameEditor';

interface ParticipantNicknameProps {
  roomId: string;
  participantId: string;
  nickname: string;
}

export function ParticipantNickname({
  roomId,
  participantId,
  nickname,
}: ParticipantNicknameProps) {
  const {
    nickname: displayedNickname,
    draft,
    error,
    startEditing,
    changeDraft,
    cancelEditing,
    confirmEditing,
  } = useNicknameEditor({ roomId, participantId, nickname });

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
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
    <div className="relative inline-flex flex-col items-center">
      <div
        className={cn(
          'inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-white/60 px-3.5',
          error && 'border-error animate-shake',
        )}
      >
        {draft === null ? (
          <>
            <span className="text-2xl leading-[normal] tracking-[2.4px]">
              {displayedNickname}
            </span>
            <button
              type="button"
              aria-label="닉네임 수정"
              onClick={startEditing}
              className="-m-2 p-2"
            >
              <EditIcon className="size-4" />
            </button>
          </>
        ) : (
          <>
            <input
              autoFocus
              aria-label="닉네임 입력"
              value={draft}
              onChange={(event) => changeDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="field-sizing-content min-w-0 bg-transparent text-2xl leading-[normal] tracking-[2.4px] outline-none"
            />
            <button
              type="button"
              aria-label="닉네임 확인"
              onMouseDown={(event) => event.preventDefault()}
              onClick={confirmEditing}
              className="-m-2 p-2"
            >
              <OkIcon className="size-4" />
            </button>
          </>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="text-error absolute top-full left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
        >
          {error}
        </p>
      )}
    </div>
  );
}
