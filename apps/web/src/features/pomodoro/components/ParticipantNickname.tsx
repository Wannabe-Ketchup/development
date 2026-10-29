import { type KeyboardEvent } from 'react';
import EditSvg from '@/assets/edit.svg?react';
import OkSvg from '@/assets/ok.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';
import { useNicknameEditor } from '../hooks/useNicknameEditor';

interface ParticipantNicknameProps {
  roomId: string;
  nickname: string;
}

export function ParticipantNickname({
  roomId,
  nickname,
}: ParticipantNicknameProps) {
  const {
    value: displayedNickname,
    draft,
    error,
    startEditing,
    changeDraft,
    cancelEditing,
    confirmEditing,
  } = useNicknameEditor({ roomId, nickname });

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
    <div
      data-tour-id="self-nickname"
      className="relative inline-flex flex-col items-center"
    >
      <div
        className={cn(
          'inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-white/60 px-3.5',
          error && 'animate-shake border-error',
        )}
      >
        {draft === null ? (
          <>
            <span className="text-2xl leading-[normal] tracking-[10%]">
              {displayedNickname}
            </span>
            <IconButton
              label="닉네임 수정"
              icon={EditSvg}
              iconClassName="size-4"
              onClick={startEditing}
              className="-m-2 p-2"
            />
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
            <IconButton
              label="닉네임 확인"
              icon={OkSvg}
              iconClassName="size-4"
              onMouseDown={(event) => event.preventDefault()}
              onClick={confirmEditing}
              className="-m-2 p-2"
            />
          </>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="absolute top-full left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
