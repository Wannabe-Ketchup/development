import { useRef, useState } from 'react';
import {
  FEEDBACK_ALLOWED_EXTENSIONS,
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
} from '@pomodoro/shared';
import ClipSvg from '@/assets/clip.svg?react';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import {
  BYTES_PER_MB,
  checkFeedbackAttachments,
  formatFileSize,
} from '../lib/feedback-attachment';

const ACCEPT = FEEDBACK_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');
const MAX_TOTAL_MB = FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES / BYTES_PER_MB;

interface FeedbackAttachmentFieldProps {
  files: File[];
  disabled: boolean;
  boxClassName: string;
  onFilesChange: (files: File[]) => void;
}

export function FeedbackAttachmentField({
  files,
  disabled,
  boxClassName,
  onFilesChange,
}: FeedbackAttachmentFieldProps) {
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (selected: File[]) => {
    const next = [...files, ...selected];
    const result = checkFeedbackAttachments(next);
    if (result.ok) {
      onFilesChange(next);
      setAttachmentError(null);
    } else {
      setAttachmentError(result.reason);
    }
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    setAttachmentError(null);
  };

  return (
    <>
      <div className={`flex flex-col gap-3 p-4 ${boxClassName}`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-base"
          >
            <ClipSvg aria-hidden="true" className="size-6" />
            사진, 동영상 첨부
          </button>
          <span className="text-sm text-gray">최대 {MAX_TOTAL_MB}MB</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPT}
          data-testid="feedback-file-input"
          onChange={(e) => {
            handleFilesSelected(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        {files.length > 0 && (
          <ul
            aria-label="첨부 파일"
            className="flex max-h-28 flex-wrap gap-2 overflow-y-auto"
          >
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex max-w-full items-center gap-2 rounded-2xl border-2 border-gray bg-white px-3 py-1"
              >
                <span className="truncate text-base">{file.name}</span>
                <span className="shrink-0 text-sm text-gray">
                  {formatFileSize(file.size)}
                </span>
                <IconButton
                  label={`${file.name} 빼기`}
                  icon={CloseSvg}
                  disabled={disabled}
                  onClick={() => handleRemoveFile(index)}
                  className="flex size-2.5 shrink-0 items-center justify-center"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {attachmentError && (
        <p role="alert" className="text-base text-error">
          {attachmentError}
        </p>
      )}
    </>
  );
}
