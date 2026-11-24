import { Feedback } from '../domain/feedback.entity';

export abstract class FeedbackMailSender {
  // 발송 실패 → ServiceUnavailableException
  abstract send(feedback: Feedback): Promise<void>;
}
