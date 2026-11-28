export const FEEDBACK_CONTENT_MAX_LENGTH = 60_000;
export const FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES = 18_000_000;
export const FEEDBACK_ATTACHMENT_MAX_COUNT = 500;
export const FEEDBACK_ALLOWED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'mp4',
  'mov',
  'webm',
] as const;
export const FEEDBACK_CONTENT_FIELD = 'content';
export const FEEDBACK_ATTACHMENTS_FIELD = 'attachments';
