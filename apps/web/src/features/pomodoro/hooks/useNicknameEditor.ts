import { changeNickname } from '@/api/room';
import { NICKNAME_MAX_LENGTH } from '@pomodoro/shared';
import { useOptimisticEditor } from './useOptimisticEditor';

interface UseNicknameEditorParams {
  roomId: string;
  nickname: string;
}

export function useNicknameEditor({
  roomId,
  nickname,
}: UseNicknameEditorParams) {
  const editor = useOptimisticEditor({
    value: nickname,
    onSave: (next) => changeNickname(roomId, next),
    validate: (draft) => {
      if (draft.length > NICKNAME_MAX_LENGTH) {
        return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이내입니다.`;
      }
      return null;
    },
  });

  return editor;
}
