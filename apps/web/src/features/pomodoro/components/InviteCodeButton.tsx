import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ShareSvg from '@/assets/share.svg?react';
import { IconButton } from '@/components/IconButton';
import { InviteCodeModal } from './InviteCodeModal';

interface InviteCodeButtonProps {
  roomId: string;
  // 모달을 열기 직전에 호출된다. page는 여기서 투어를 닫는다
  onOpen: () => void;
}

export function InviteCodeButton({ roomId, onOpen }: InviteCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 투어를 닫으면 포커스가 "how to use"로 가서 dialog의 기본 포커스 복원 대상이 바뀐다.
  // 그래서 닫을 때 열기 버튼으로 직접 되돌린다.
  // 모달이 언마운트되어 배경 inert가 풀린 뒤여야 포커스가 가므로 flushSync로 먼저 반영한다
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
        label="초대코드 보기"
        icon={ShareSvg}
        aria-haspopup="dialog"
        onClick={handleOpen}
        className="absolute top-9 right-9 z-20"
      />
      {isOpen && <InviteCodeModal roomId={roomId} onClose={handleClose} />}
    </>
  );
}
