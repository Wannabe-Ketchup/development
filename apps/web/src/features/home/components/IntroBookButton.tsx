import { useRef, useState } from 'react';
import {
  PILL_CONTENT_CLASS_NAME,
  SquigglePill,
} from '@/components/SquigglePill';
import { IntroBook } from './IntroBook';

interface IntroBookButtonProps {
  // 열기 전에 홈의 방 선택 그룹을 닫는다
  onOpen: () => void;
}

// 버튼과 그 열림 상태·포커스 복귀를 함께 둔다. 책(IntroBook)은 닫혀 있어도 항상 마운트한다
export function IntroBookButton({ onOpen }: IntroBookButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="absolute right-11 bottom-10 z-20">
        <SquigglePill>
          <button
            ref={buttonRef}
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              onOpen();
              setIsOpen(true);
            }}
            className={PILL_CONTENT_CLASS_NAME}
          >
            <BookIcon />
            사용 설명서
          </button>
        </SquigglePill>
      </div>
      <IntroBook
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          buttonRef.current?.focus();
        }}
      />
    </>
  );
}

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      width="34"
      height="28"
      viewBox="0 0 34 28"
      fill="none"
    >
      <path
        d="M17 6 C12 2 6 2 2 4 L2 25 C6 23 12 23 17 26 C22 23 28 23 32 25 L32 4 C28 2 22 2 17 6 Z"
        fill="#fff"
        stroke="#1b1b1b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M17 6 L17 26" stroke="#1b1b1b" strokeWidth="2.5" />
      <path
        d="M6 10 L13 10 M6 15 L13 15 M21 10 L28 10 M21 15 L28 15"
        stroke="#bababa"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
