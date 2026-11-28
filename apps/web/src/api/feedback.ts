import {
  FEEDBACK_ATTACHMENTS_FIELD,
  FEEDBACK_CONTENT_FIELD,
} from '@pomodoro/shared';
import { api } from './http';

const FAILURE_REASON_BY_STATUS: Record<number, SubmitFeedbackFailureReason> = {
  400: 'invalid',
  413: 'too-large',
  429: 'quota-exceeded',
  503: 'unavailable',
};
const SUBMIT_FEEDBACK_FAILED_MESSAGE = '피드백을 보내지 못했습니다.';

// invalid: 400 내용 또는 지원하지 않는 형식 / too-large: 413 첨부 용량·개수 초과 / quota-exceeded: 429 오늘 접수 마감
// unavailable: 503 메일 발송 실패 / unknown: 그 밖의 status, 네트워크 오류
export type SubmitFeedbackFailureReason =
  'invalid' | 'too-large' | 'quota-exceeded' | 'unavailable' | 'unknown';

export class SubmitFeedbackError extends Error {
  readonly reason: SubmitFeedbackFailureReason;

  constructor(reason: SubmitFeedbackFailureReason) {
    super(SUBMIT_FEEDBACK_FAILED_MESSAGE);
    this.name = 'SubmitFeedbackError';
    this.reason = reason;
  }
}

// Content-Type은 브라우저가 boundary와 함께 정한다. nginx의 HTML 413 등 본문은 파싱하지 않고 status로만 나눈다
export async function submitFeedback(
  content: string,
  files: File[],
): Promise<void> {
  const body = new FormData();
  body.append(FEEDBACK_CONTENT_FIELD, content);
  for (const file of files) body.append(FEEDBACK_ATTACHMENTS_FIELD, file);

  const response = await api('/api/feedbacks', { method: 'POST', body }).catch(
    () => {
      throw new SubmitFeedbackError('unknown');
    },
  );
  if (response.ok) return;
  throw new SubmitFeedbackError(
    FAILURE_REASON_BY_STATUS[response.status] ?? 'unknown',
  );
}
