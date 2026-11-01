import { changeNickname } from '@/api/room';
import { getNicknameWeight, NICKNAME_MAX_WEIGHT } from '@pomodoro/shared';
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
      if (getNicknameWeight(draft) > NICKNAME_MAX_WEIGHT) {
        return '닉네임이 너무 깁니다. 줄여 주세요.';
      }
      return null;
    },
  });

  return editor;
}
