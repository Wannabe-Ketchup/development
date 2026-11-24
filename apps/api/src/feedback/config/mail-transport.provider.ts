import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

// Transporter는 타입이라 DI 토큰이 될 수 없어 클래스로 감싼다
export class FeedbackMailTransport {
  constructor(readonly transporter: Pick<Transporter, 'sendMail' | 'verify'>) {}
}

// 토큰 발급·재발급 절차는 docs/deployment.md "피드백 메일 OAuth2 토큰"
export const FeedbackMailTransportProvider = {
  provide: FeedbackMailTransport,
  useFactory: (configService: ConfigService): FeedbackMailTransport =>
    new FeedbackMailTransport(
      createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
        socketCloseTimeout: 0,
        auth: {
          type: 'OAuth2',
          user: configService.getOrThrow<string>('FEEDBACK_MAIL_USER'),
          clientId: configService.getOrThrow<string>('FEEDBACK_MAIL_CLIENT_ID'),
          clientSecret: configService.getOrThrow<string>(
            'FEEDBACK_MAIL_CLIENT_SECRET',
          ),
          refreshToken: configService.getOrThrow<string>(
            'FEEDBACK_MAIL_REFRESH_TOKEN',
          ),
        },
      }),
    ),
  inject: [ConfigService],
};
