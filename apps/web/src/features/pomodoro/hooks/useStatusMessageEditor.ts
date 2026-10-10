import { changeStatusMessage } from '@/api/room';
import { STATUS_MESSAGE_MAX_LENGTH } from '@pomodoro/shared';
import { useOptimisticEditor } from './useOptimisticEditor';

interface UseStatusMessageEditorParams {
  roomId: string;
  participantId: string;
  statusMessage: string;
}

export function useStatusMessageEditor({
  roomId,
  participantId,
  statusMessage,
}: UseStatusMessageEditorParams) {
  const editor = useOptimisticEditor({
    value: statusMessage,
    onSave: (next) => changeStatusMessage(roomId, participantId, next),
    validate: (draft) => {
      if (draft.length > STATUS_MESSAGE_MAX_LENGTH) {
        return `상태메시지는 ${STATUS_MESSAGE_MAX_LENGTH}자 이내입니다.`;
      }
      return null;
    },
  });

  return editor;
}
