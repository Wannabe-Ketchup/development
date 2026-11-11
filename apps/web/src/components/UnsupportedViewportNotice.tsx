import { useId, type ReactNode } from 'react';
import { useSquigglePath } from '@squiggle-line/react';
import TomatoConstructionSvg from '@/assets/tomato_construction.svg?react';
import { CopyButton } from '@/components/CopyButton';
import { Modal } from '@/components/Modal';

const WOBBLY_STROKE_CLASS_NAME = 'fill-none stroke-black';

const DIVIDER_WIDTH_PX = 300;
const DIVIDER_HEIGHT_PX = 8;
const DIVIDER_SQUIGGLE = { wiggle: 16, frequency: 200, smoothen: 74 };

interface UnsupportedViewportNoticeProps {
  // 원래 화면의 배경. 그 위에 모달 백드롭이 어둡게 깔린다
  background: ReactNode;
}

// 닫을 수 없는 모달이다. 이 화면에서는 링크 복사 말고 할 수 있는 일이 없다
export function UnsupportedViewportNotice({
  background,
}: UnsupportedViewportNoticeProps) {
  const titleId = useId();

  return (
    <main className="relative h-dvh w-dvw overflow-hidden">
      {background}
      {/* 시안 크기 그대로 두고, 화면보다 크면 Modal이 통째로 줄인다 */}
      <Modal
        labelledBy={titleId}
        className="w-110 items-center gap-5 text-center break-keep"
      >
        <TomatoConstructionSvg aria-hidden="true" />
        <h2 id={titleId} className="text-2xl leading-normal">
          앗, 모바일은
          <br />
          아직 준비 중이에요
        </h2>
        <SquiggleDivider />
        <p className="text-base leading-loose">
          토마토들과 함께하는 집중 시간은 지금 데스크톱에서만 열려 있어요. PC로
          다시 찾아와 주세요!
        </p>
        <CopyButton
          text={window.location.href}
          label="링크 복사하기"
          copiedAnnouncement="링크를 복사했어요"
          failedAnnouncement="링크를 복사하지 못했어요"
        />
      </Modal>
    </main>
  );
}

function SquiggleDivider() {
  const path = useSquigglePath(
    `M 2 ${DIVIDER_HEIGHT_PX / 2} L ${DIVIDER_WIDTH_PX - 2} ${DIVIDER_HEIGHT_PX / 2}`,
    DIVIDER_SQUIGGLE,
  );

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${DIVIDER_WIDTH_PX} ${DIVIDER_HEIGHT_PX}`}
      preserveAspectRatio="none"
      className="h-2 w-full overflow-visible"
    >
      <path
        d={path}
        className={WOBBLY_STROKE_CLASS_NAME}
        strokeWidth={3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
