import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Timer } from '@pomodoro/shared';
import SettingsSvg from '@/assets/settings.svg?react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/IconButton';
import { TimerSettingsModal } from './TimerSettingsModal';

interface TimerSettingsButtonProps {
  roomId: string;
  timer: Timer;
  isEditable: boolean;
  // 모달을 열기 직전에 호출된다. page는 여기서 투어를 닫는다
  onOpen: () => void;
  className?: string;
}

export function TimerSettingsButton({
  roomId,
  timer,
  isEditable,
  onOpen,
  className,
}: TimerSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // InviteCodeButton과 같은 이유로, 모달을 먼저 내려 배경 inert를 푼 뒤 열기 버튼으로 포커스를 되돌린다
  const handleClose = () => {
    flushSync(() => setIsOpen(false));
    buttonRef.current?.focus();
  };

  const handleOpen = () => {
    onOpen();
    setIsOpen(true);
  };

  return (
    <>
      <IconButton
        ref={buttonRef}
        label="시간 설정"
        icon={SettingsSvg}
        aria-haspopup="dialog"
        onClick={handleOpen}
        className={cn('flex size-20 items-center justify-center', className)}
      />
      {isOpen && (
        <TimerSettingsModal
          roomId={roomId}
          timer={timer}
          isEditable={isEditable}
          onClose={handleClose}
        />
      )}
    </>
  );
}
