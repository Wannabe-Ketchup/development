import { type KeyboardEvent } from 'react';
import EditSvg from '@/assets/edit.svg?react';
import OkSvg from '@/assets/ok.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';
import { useNicknameEditor } from '../hooks/useNicknameEditor';

// 좁은 화면(compact-safe-area 안)에서는 누르는 영역만 48px로 넓힌다. 모양과 배치는 그대로다
const COMPACT_TOUCH_CLASS_NAME =
  'in-[.compact-safe-area]:-m-4 in-[.compact-safe-area]:p-4';

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
          'inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-white/60 px-3.5 font-ongleipryudung',
          error && 'animate-shake border-error',
        )}
      >
        {draft === null ? (
          <>
            <span className="text-title leading-[normal] whitespace-pre in-[.compact-safe-area]:text-title-sm">
              {displayedNickname}
            </span>
            <IconButton
              label="닉네임 수정"
              icon={EditSvg}
              iconClassName="size-4"
              onClick={startEditing}
              className={cn('-m-2 p-2', COMPACT_TOUCH_CLASS_NAME)}
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
              className="field-sizing-content min-w-0 bg-transparent text-title leading-[normal] outline-none in-[.compact-safe-area]:text-title-sm"
            />
            <IconButton
              label="닉네임 확인"
              icon={OkSvg}
              iconClassName="size-4"
              onMouseDown={(event) => event.preventDefault()}
              onClick={confirmEditing}
              className={cn('-m-2 p-2', COMPACT_TOUCH_CLASS_NAME)}
            />
          </>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="absolute top-full left-1/2 -translate-x-1/2 text-caption whitespace-nowrap text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
