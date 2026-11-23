import { useRef, useState } from 'react';
import {
  submitFeedback,
  SubmitFeedbackError,
  type SubmitFeedbackFailureReason,
} from '@/api/feedback';

export type SubmitFeedbackState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'failed'; reason: SubmitFeedbackFailureReason };

export function useSubmitFeedback() {
  const [state, setState] = useState<SubmitFeedbackState>({ status: 'idle' });
  const isSendingRef = useRef(false);

  const submit = async (content: string, files: File[]) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setState({ status: 'sending' });
    try {
      await submitFeedback(content, files);
      setState({ status: 'sent' });
    } catch (error) {
      const reason =
        error instanceof SubmitFeedbackError ? error.reason : 'unknown';
      setState({ status: 'failed', reason });
    } finally {
      isSendingRef.current = false;
    }
  };

  return { state, submit };
}
