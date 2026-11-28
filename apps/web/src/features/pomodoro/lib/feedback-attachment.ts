import {
  FEEDBACK_ALLOWED_EXTENSIONS,
  FEEDBACK_ATTACHMENT_MAX_COUNT,
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
} from '@pomodoro/shared';

type ValidationResult = { ok: true } | { ok: false; reason: string };

const ALLOWED_EXTENSIONS: readonly string[] = FEEDBACK_ALLOWED_EXTENSIONS;
const BYTES_PER_KB = 1000;
export const BYTES_PER_MB = 1_000_000;

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

// 확장자만 본다. 내용 판별은 서버가 한다
export function checkFeedbackAttachments(files: File[]): ValidationResult {
  if (FEEDBACK_ATTACHMENT_MAX_COUNT < files.length) {
    return {
      ok: false,
      reason: `첨부는 최대 ${FEEDBACK_ATTACHMENT_MAX_COUNT}개까지 보낼 수 있어요`,
    };
  }
  const unsupported = files.find(
    (file) => !ALLOWED_EXTENSIONS.includes(getExtension(file.name)),
  );
  if (unsupported) {
    return {
      ok: false,
      reason: `${unsupported.name}은(는) 첨부할 수 없는 형식이에요`,
    };
  }
  const empty = files.find((file) => file.size === 0);
  if (empty) {
    return { ok: false, reason: `${empty.name}은(는) 빈 파일이에요` };
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES < totalBytes) {
    return {
      ok: false,
      reason: `첨부는 합쳐서 ${FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES / BYTES_PER_MB}MB까지 보낼 수 있어요`,
    };
  }
  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (BYTES_PER_MB <= bytes) return `${(bytes / BYTES_PER_MB).toFixed(1)}MB`;
  if (BYTES_PER_KB <= bytes) return `${Math.round(bytes / BYTES_PER_KB)}KB`;
  return `${bytes}B`;
}
