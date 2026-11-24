import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationSender } from '../../common/notification/notification-sender';
import { KST_OFFSET_MS } from '../domain/daily-feedback-quota';
import { Feedback } from '../domain/feedback.entity';
import { FeedbackMailTransport } from '../config/mail-transport.provider';
import { FeedbackMailSender } from '../service/feedback-mail-sender';

const FEEDBACK_MAIL_SUBJECT = '[뽀모도로] 사용자 피드백';
export const FEEDBACK_MAIL_SEND_TIMEOUT_MS = 50_000;
const AUTH_FAILURE_CODES = new Set(['EAUTH', 'EOAUTH2', 'ENOAUTH']);
const FAILURE_ACTION =
  'docs/deployment.md "피드백 메일 OAuth2 토큰" 참고. 인증 오류면 refresh token을 다시 발급';

interface MailError {
  code: string;
  // nodemailer는 토큰 갱신 실패(EOAUTH2)를 EAUTH로 감싸고 원래 코드를 여기에 남긴다
  originalCode?: string;
}

function mailErrorOf(error: unknown): MailError {
  if (!(error instanceof Error)) return { code: 'unknown' };
  const { code, originalCode } = error as Error & {
    code?: unknown;
    originalCode?: unknown;
  };
  return {
    code: typeof code === 'string' && code ? code : 'unknown',
    originalCode:
      typeof originalCode === 'string' && originalCode
        ? originalCode
        : undefined,
  };
}

function describeMailError({ code, originalCode }: MailError): string {
  return originalCode ? `${code} (원인 ${originalCode})` : code;
}

function formatKst(date: Date): string {
  return `${new Date(date.getTime() + KST_OFFSET_MS)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')} (KST)`;
}

@Injectable()
export class NodemailerFeedbackMailSender
  extends FeedbackMailSender
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(NodemailerFeedbackMailSender.name);

  constructor(
    private readonly mailTransport: FeedbackMailTransport,
    private readonly configService: ConfigService,
    private readonly notificationSender: NotificationSender,
    private readonly sendTimeoutMs: number,
  ) {
    super();
  }

  onApplicationBootstrap(): void {
    void this.verifyConnection();
  }

  async verifyConnection(): Promise<void> {
    try {
      await this.mailTransport.transporter.verify();
      this.logger.log('피드백 메일 접속 확인 성공');
    } catch (error) {
      const mailError = describeMailError(mailErrorOf(error));
      this.logger.warn(`피드백 메일 접속 확인 실패 code=${mailError}`);
      await this.notifyFailure(
        '피드백 메일 접속 확인 실패',
        '서버 시작',
        mailError,
      );
    }
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
      const mailError = mailErrorOf(error);
      const description = describeMailError(mailError);
      this.logger.warn(
        `피드백 메일 발송 실패 code=${description} ${elapsedLog()} ${sizeLog}`,
      );
      if (AUTH_FAILURE_CODES.has(mailError.code)) {
        await this.notifyFailure(
          '피드백 메일 인증 실패',
          '피드백 발송',
          description,
        );
      }
      throw new ServiceUnavailableException('피드백을 보내지 못했습니다.');
    }
  }

  // 알림이 실패해도 서버 시작·503 응답은 그대로 둔다
  private async notifyFailure(
    title: string,
    stage: string,
    errorDescription: string,
  ): Promise<void> {
    try {
      await this.notificationSender.send({
        title,
        fields: [
          { name: '시점', value: stage },
          { name: '오류 코드', value: errorDescription },
          { name: '조치', value: FAILURE_ACTION },
        ],
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown';
      this.logger.warn(`${title} 알림을 보내지 못했습니다. (${reason})`);
    }
  }
}
