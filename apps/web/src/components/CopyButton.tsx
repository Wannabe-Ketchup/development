import { WobblyBox } from '@squiggle-line/react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const COPY_BUTTON_WOBBLY = {
  wiggle: 16,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 100,
  pathClassName: 'fill-none stroke-black',
};

interface CopyButtonProps {
  // 복사할 값. 아직 없으면(불러오는 중, 실패) null이고 버튼은 비활성화된다
  text: string | null;
  // 복사 전 버튼 문구
  label: string;
  // 복사 결과 발화. 무엇을 복사했는지 화면마다 달라 받는다
  copiedAnnouncement: string;
  failedAnnouncement: string;
}

// 누르면 text를 클립보드에 복사하고, 잠시 버튼 문구와 스크린 리더 발화로 결과를 알린다
export function CopyButton({
  text,
  label,
  copiedAnnouncement,
  failedAnnouncement,
}: CopyButtonProps) {
  const { copyStatus, copy } = useCopyToClipboard();

  const buttonLabel = {
    idle: label,
    copied: '복사했어요!',
    failed: '복사하지 못했어요',
  }[copyStatus];
  const announcement = {
    idle: '',
    copied: copiedAnnouncement,
    failed: failedAnnouncement,
  }[copyStatus];

  return (
    <>
      <WobblyBox {...COPY_BUTTON_WOBBLY} className="w-full">
        <button
          type="button"
          disabled={text === null}
          onClick={() => {
            if (text !== null) void copy(text);
          }}
          className="flex h-15 w-full items-center justify-center rounded-full bg-tomato-body-4 text-2xl text-white disabled:cursor-default disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </WobblyBox>
      {/* 버튼 이름 변경을 읽지 않는 스크린 리더를 위해 결과를 따로 발화한다 */}
      <output className="sr-only">{announcement}</output>
    </>
  );
}
