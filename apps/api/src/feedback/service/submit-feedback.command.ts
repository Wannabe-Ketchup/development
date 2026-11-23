export interface SubmitFeedbackCommand {
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
}
