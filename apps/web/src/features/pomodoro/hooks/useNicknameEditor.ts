import { useRef, useState } from 'react';
import { changeNickname } from '@/api/room';
import { NICKNAME_MAX_LENGTH } from '@pomodoro/shared';

interface NicknameEditing {
  draft: string;
  error: string | null;
}

interface UseNicknameEditorParams {
  roomId: string;
  participantId: string;
  nickname: string;
}

export function useNicknameEditor({
  roomId,
  participantId,
  nickname,
}: UseNicknameEditorParams) {
  const [editing, setEditing] = useState<NicknameEditing | null>(null);
  const [sentNickname, setSentNickname] = useState<string | null>(null);

  const isSendingRef = useRef(false);
  const queuedRef = useRef<string | null>(null);

  if (sentNickname === nickname) {
    setSentNickname(null);
  }

  const displayedNickname = sentNickname ?? nickname;

  const send = async (next: string): Promise<void> => {
    isSendingRef.current = true;

    try {
      await changeNickname(roomId, participantId, next);
    } catch (cause) {
      // 뒤이어 보낼 값이 있거나 사용자가 다시 입력 중이면 이 거절은 지나간 의도다.
      if (queuedRef.current === null) {
        setSentNickname(null);
        setEditing(
          (current) =>
            current ?? { draft: next, error: (cause as Error).message },
        );
      }
    } finally {
      isSendingRef.current = false;

      const queued = queuedRef.current;
      queuedRef.current = null;

      if (queued !== null) {
        await send(queued);
      }
    }
  };

  const confirmEditing = () => {
    if (editing === null) return;

    const next = editing.draft;
    setEditing(null);

    if (next === displayedNickname) return;

    setSentNickname(next);

    if (isSendingRef.current) {
      queuedRef.current = next;
      return;
    }

    void send(next);
  };

  return {
    nickname: displayedNickname,
    draft: editing?.draft ?? null,
    error: editing?.error ?? null,
    startEditing: () => setEditing({ draft: displayedNickname, error: null }),
    changeDraft: (draft: string) =>
      setEditing((current) => {
        if (!current) return current;
        if (draft.length > NICKNAME_MAX_LENGTH)
          return {
            ...current,
            error: `닉네임은 ${NICKNAME_MAX_LENGTH}자 이내입니다.`,
          };
        return { draft, error: null };
      }),
    cancelEditing: () => setEditing(null),
    confirmEditing,
  };
}
