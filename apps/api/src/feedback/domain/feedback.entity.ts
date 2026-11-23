import { Attachment } from './attachment';
import { Attachments } from './attachments';
import { FeedbackContent } from './feedback-content';

export class Feedback {
  private constructor(
    readonly content: FeedbackContent,
    readonly attachments: Attachments,
    readonly ip: string,
    readonly participantId: string,
    readonly userAgent: string,
    readonly submittedAt: Date,
  ) {}

  static restore(props: {
    content: FeedbackContent;
    attachments: Attachments;
    ip: string;
    participantId: string;
    userAgent: string;
    submittedAt: Date;
  }): Feedback {
    return new Feedback(
      props.content,
      props.attachments,
      props.ip,
      props.participantId,
      props.userAgent,
      props.submittedAt,
    );
  }

  static create(props: {
    content: string;
    attachments: {
      originalName: string;
      header: Uint8Array;
      path: string;
      size: number;
    }[];
    ip: string;
    participantId: string;
    userAgent: string;
    submittedAt: Date;
  }): Feedback {
    return new Feedback(
      FeedbackContent.of(props.content),
      Attachments.of(
        props.attachments.map((attachment, index) =>
          Attachment.of({ ...attachment, order: index + 1 }),
        ),
      ),
      props.ip,
      props.participantId,
      props.userAgent,
      props.submittedAt,
    );
  }
}
