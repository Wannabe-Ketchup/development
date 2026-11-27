import { useEffect, useId, useRef, useState } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import {
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
  FEEDBACK_CONTENT_MAX_LENGTH,
} from '@pomodoro/shared';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import type { SubmitFeedbackFailureReason } from '@/api/feedback';
import { useSubmitFeedback } from '../hooks/useSubmitFeedback';
import { BYTES_PER_MB } from '../lib/feedback-attachment';
import { FeedbackAttachmentField } from './FeedbackAttachmentField';

const SEND_BUTTON_WOBBLY = {
  wiggle: 16,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 100,
  pathClassName: 'fill-none stroke-black',
};
const MAX_TOTAL_MB = FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES / BYTES_PER_MB;
const BOX_CLASS_NAME = 'rounded-2xl border-2 border-gray bg-white';

const FAILURE_MESSAGE: Record<SubmitFeedbackFailureReason, string> = {
  invalid: '내용이나 첨부 파일을 확인해 주세요',
  'too-large': `첨부가 너무 커요. 합쳐서 ${MAX_TOTAL_MB}MB 이하로 줄여 주세요`,
  'quota-exceeded':
    '오늘 받을 수 있는 피드백이 가득 찼어요. 내일 다시 보내 주세요',
  unavailable: '지금은 피드백을 보낼 수 없어요. 잠시 뒤 다시 시도해 주세요',
  unknown: '피드백을 보내지 못했어요. 다시 시도해 주세요',
};

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const titleId = useId();
  const { state, submit } = useSubmitFeedback();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isSending = state.status === 'sending';
  const isSent = state.status === 'sent';
  const hasInput = content !== '' || files.length > 0;
  const canSend = content.trim() !== '' && !isSending;
  // onClose를 넘기지 않으면 Modal이 Esc·바깥 클릭으로 닫히지 않는다
  const isDismissible = !isSending && (isSent || !hasInput);

  // Modal이 먼저 showModal()을 한 뒤여야 포커스가 간다
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 전송하기 버튼이 사라지므로 포커스를 닫기로 옮긴다
  useEffect(() => {
    if (isSent) closeButtonRef.current?.focus();
  }, [isSent]);

  return (
    <Modal
      labelledBy={titleId}
      onClose={isDismissible ? onClose : undefined}
      className="w-125 max-w-full gap-4"
    >
      <div className="flex w-full items-center justify-between">
        <h2 id={titleId} className="text-title leading-[normal]">
          피드백 보내기
        </h2>
        <IconButton
          ref={closeButtonRef}
          label="닫기"
          icon={CloseSvg}
          disabled={isSending}
          onClick={onClose}
          className="flex size-6 items-center justify-center in-[.compact-safe-area]:-m-3 in-[.compact-safe-area]:size-12"
        />
      </div>
      {isSent ? (
        <output className="flex h-20 w-full items-center justify-center text-body-sm">
          피드백을 보냈어요
        </output>
      ) : (
        <div aria-busy={isSending} className="flex w-full flex-col gap-4">
          <textarea
            ref={textareaRef}
            aria-label="내용"
            value={content}
            maxLength={FEEDBACK_CONTENT_MAX_LENGTH}
            placeholder="어떤 점이 좋았고 어떤 점이 불편했는지 적어주세요"
            readOnly={isSending}
            onChange={(e) => setContent(e.target.value)}
            className={`h-39 w-full resize-none p-4 text-body-sm ${BOX_CLASS_NAME}`}
          />
          <FeedbackAttachmentField
            files={files}
            disabled={isSending}
            boxClassName={BOX_CLASS_NAME}
            onFilesChange={setFiles}
          />
          {state.status === 'failed' && (
            <p role="alert" className="text-body-sm text-error">
              {FAILURE_MESSAGE[state.reason]}
            </p>
          )}
          <WobblyBox {...SEND_BUTTON_WOBBLY} className="w-full">
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void submit(content, files)}
              className="flex h-15 w-full items-center justify-center rounded-full bg-tomato-body-4 text-title text-white disabled:pointer-events-none disabled:bg-gray"
            >
              {isSending ? '전송 중' : '전송하기'}
            </button>
          </WobblyBox>
        </div>
      )}
    </Modal>
  );
}
