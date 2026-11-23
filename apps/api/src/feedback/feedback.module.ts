import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../common/clock/clock';
import { SystemClock } from '../common/clock/system.clock';
import { FeedbackController } from './controller/feedback.controller';
import { FeedbackUploadDirectory } from './config/feedback-upload-directory';
import {
  FeedbackMailTransport,
  FeedbackMailTransportProvider,
} from './config/mail-transport.provider';
import { InMemoryFeedbackQuotaRepository } from './repository/in-memory.feedback-quota.repository';
import { FeedbackQuotaRepository } from './repository/feedback-quota.repository';
import {
  FEEDBACK_MAIL_SEND_TIMEOUT_MS,
  NodemailerFeedbackMailSender,
} from './repository/nodemailer.feedback-mail-sender';
import { FeedbackMailSender } from './service/feedback-mail-sender';
import { SubmitFeedbackService } from './service/submit-feedback.service';

@Module({
  controllers: [FeedbackController],
  providers: [
    { provide: Clock, useClass: SystemClock },
    FeedbackMailTransportProvider,
    FeedbackUploadDirectory,
    SubmitFeedbackService,
    {
      provide: FeedbackQuotaRepository,
      useClass: InMemoryFeedbackQuotaRepository,
    },
    {
      provide: FeedbackMailSender,
      useFactory: (
        transport: FeedbackMailTransport,
        configService: ConfigService,
      ) =>
        new NodemailerFeedbackMailSender(
          transport,
          configService,
          FEEDBACK_MAIL_SEND_TIMEOUT_MS,
        ),
      inject: [FeedbackMailTransport, ConfigService],
    },
  ],
})
export class FeedbackModule {}
