import type { ReactNode, Ref } from 'react';
import type { Timer } from '@pomodoro/shared';
import HelpSvg from '@/assets/help.svg?react';
import { IconButton } from '@/components/IconButton';
import { FeedbackButton } from '../FeedbackButton';
import { InviteCodeButton } from '../InviteCodeButton';
import { TimerSettingsButton } from '../TimerSettingsButton';

// 보이는 아이콘은 48px, 누르는 영역은 56px
const TOP_BUTTON_CLASS_NAME = 'size-14 [&_svg]:size-12';

interface CompactTopBarProps {
  roomId: string;
  timer: Timer;
  isTimerEditable: boolean;
  isTourOpen: boolean;
  howToUseRef: Ref<HTMLButtonElement>;
  onOpenTour: () => void;
  // 모달을 열기 직전에 호출된다. 열려 있는 투어를 닫는 데 쓴다
  onOpenModal: () => void;
  // 왼쪽에 놓을 것(폰은 참여자 위치 점)
  children?: ReactNode;
}

// 상단 줄. 오른쪽에 ? · 설정 · 초대 · 피드백을 붙여 둔다
export function CompactTopBar({
  roomId,
  timer,
  isTimerEditable,
  isTourOpen,
  howToUseRef,
  onOpenTour,
  onOpenModal,
  children,
}: CompactTopBarProps) {
  return (
    <div className="absolute inset-x-0 top-(--safe-top) z-10 flex h-13 items-center justify-between pr-[max(calc(var(--side)-6px),var(--safe-right))] pl-[max(var(--side),var(--safe-left))]">
      <div>{children}</div>
      <div className="flex">
        <IconButton
          ref={howToUseRef}
          label="how to use"
          icon={HelpSvg}
          aria-expanded={isTourOpen}
          aria-controls="coach-mark-tour"
          onClick={onOpenTour}
          className={`flex items-center justify-center ${TOP_BUTTON_CLASS_NAME}`}
        />
        <TimerSettingsButton
          roomId={roomId}
          timer={timer}
          isEditable={isTimerEditable}
          onOpen={onOpenModal}
          className={TOP_BUTTON_CLASS_NAME}
        />
        <InviteCodeButton
          roomId={roomId}
          onOpen={onOpenModal}
          className={TOP_BUTTON_CLASS_NAME}
        />
        <FeedbackButton
          onOpen={onOpenModal}
          className={TOP_BUTTON_CLASS_NAME}
        />
      </div>
    </div>
  );
}
