import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import FeedbackSvg from '@/assets/feedback.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  // 모달을 열기 직전에 호출된다. page는 여기서 투어를 닫는다
  onOpen: () => void;
  // 위치와 다크모드 처리는 놓이는 쪽(page)이 정한다
  className?: string;
}

export function FeedbackButton({ onOpen, className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // InviteCodeButton과 같이, 모달이 언마운트된 뒤 열기 버튼으로 포커스를 되돌린다
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
        label="피드백 보내기"
        icon={FeedbackSvg}
        aria-haspopup="dialog"
        onClick={handleOpen}
        className={cn('flex size-20 items-center justify-center', className)}
      />
      {isOpen && <FeedbackModal onClose={handleClose} />}
    </>
  );
}
