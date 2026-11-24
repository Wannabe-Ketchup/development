import { useRef, useState } from 'react';
import type { ChatMessage } from '@pomodoro/shared';
import {
  sendChatMessage,
  SendChatMessageError,
  type SendChatMessageFailureReason,
} from '@/api/chat';

export type SendChatMessageState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'failed'; reason: SendChatMessageFailureReason };

interface UseChatMessageFormParams {
  roomId: string;
  onSent: (message: ChatMessage) => void;
}

// 보내지 못하면 입력을 지우지 않는다. 그대로 다시 보내면 같은 clientMessageId를 써서,
// 실제로는 저장됐는데 응답만 못 받은 메시지가 두 번 올라가지 않는다
export function useChatMessageForm({
  roomId,
  onSent,
}: UseChatMessageFormParams) {
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<SendChatMessageState>({ status: 'idle' });
  // 같은 틱의 중복 전송은 state로 막을 수 없어 ref로 막는다
  const isSendingRef = useRef(false);
  const clientMessageIdRef = useRef<string | null>(null);

  const canSend = draft.trim() !== '' && state.status !== 'sending';

  // 내용을 고치면 다른 메시지로 본다. 같은 ID로 보내면 서버가 처음 메시지의 재전송으로 여겨 고친 내용을 버린다
  const changeDraft = (nextDraft: string) => {
    if (isSendingRef.current) return;
    clientMessageIdRef.current = null;
    setDraft(nextDraft);
    setState({ status: 'idle' });
  };

  const send = async () => {
    if (!canSend || isSendingRef.current) return;
    isSendingRef.current = true;
    clientMessageIdRef.current ??= crypto.randomUUID();
    setState({ status: 'sending' });
    try {
      const message = await sendChatMessage(roomId, {
        clientMessageId: clientMessageIdRef.current,
        content: draft,
      });
      onSent(message);
      setDraft('');
      setState({ status: 'idle' });
    } catch (error) {
      const reason =
        error instanceof SendChatMessageError ? error.reason : 'unknown';
      setState({ status: 'failed', reason });
    } finally {
      isSendingRef.current = false;
    }
  };

  return { draft, state, canSend, changeDraft, send };
}
