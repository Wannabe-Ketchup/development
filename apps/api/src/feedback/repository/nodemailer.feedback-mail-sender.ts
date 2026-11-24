import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KST_OFFSET_MS } from '../domain/daily-feedback-quota';
import { Feedback } from '../domain/feedback.entity';
import { FeedbackMailTransport } from '../config/mail-transport.provider';
import { FeedbackMailSender } from '../service/feedback-mail-sender';

const FEEDBACK_MAIL_SUBJECT = '[뽀모도로] 사용자 피드백';
export const FEEDBACK_MAIL_SEND_TIMEOUT_MS = 50_000;

function formatKst(date: Date): string {
  return `${new Date(date.getTime() + KST_OFFSET_MS)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')} (KST)`;
}

@Injectable()
export class NodemailerFeedbackMailSender extends FeedbackMailSender {
  private readonly logger = new Logger(NodemailerFeedbackMailSender.name);

  constructor(
    private readonly mailTransport: FeedbackMailTransport,
    private readonly configService: ConfigService,
    private readonly sendTimeoutMs: number,
  ) {
    super();
  }

  async send(feedback: Feedback): Promise<void> {
    const address = this.configService.getOrThrow<string>('FEEDBACK_MAIL_USER');
    const text = [
      `접수 시각: ${formatKst(feedback.submittedAt)}`,
      `IP: ${feedback.ip}`,
      `참여자 ID: ${feedback.participantId}`,
      `UA: ${feedback.userAgent}`,
      '',
      feedback.content.value,
    ].join('\n');

    const attachments = feedback.attachments.toArray();
    const sizeLog = `attachmentCount=${attachments.length} attachmentBytes=${feedback.attachments.totalBytes}`;
    const startedAt = performance.now();
    const elapsedLog = () =>
      `durationMs=${Math.round(performance.now() - startedAt)}`;

    try {
      await this.mailTransport.transporter.sendMail({
        from: address,
        to: address,
        subject: FEEDBACK_MAIL_SUBJECT,
        text,
        textEncoding: 'base64',
        signal: AbortSignal.timeout(this.sendTimeoutMs),
        attachments: attachments.map((attachment) => ({
          filename: attachment.fileName,
          contentType: attachment.mimeType,
          path: attachment.path,
        })),
      });
      this.logger.log(`피드백 메일 발송 완료 ${elapsedLog()} ${sizeLog}`);
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error ? String(error.code) : '';
      this.logger.warn(
        `피드백 메일 발송 실패 code=${code || 'unknown'} ${elapsedLog()} ${sizeLog}`,
      );
      throw new ServiceUnavailableException('피드백을 보내지 못했습니다.');
    }
  }
}
