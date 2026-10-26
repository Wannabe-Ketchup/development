import { useState } from 'react';
import { pausePomodoro } from '@/api/timer';
import { PILL_CONTENT_CLASS_NAME } from './SquigglePill';

interface PausePomodoroButtonProps {
  roomId: string;
}

export function PausePomodoroButton({ roomId }: PausePomodoroButtonProps) {
  const [isPausing, setIsPausing] = useState(false);

  // 성공하면 SSE로 status가 바뀌어 resume 버튼으로 교체되므로 실패했을 때만 되돌린다
  const handleClick = async () => {
    setIsPausing(true);
    try {
      await pausePomodoro(roomId);
    } catch {
      setIsPausing(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isPausing}
      onClick={handleClick}
      className={PILL_CONTENT_CLASS_NAME}
    >
      pause
      {/* ⏸ 아이콘: Figma 막대 2개(6.4×16px, 간격 3.2px) */}
      <span aria-hidden="true" className="flex gap-[3.2px]">
        <span className="h-4 w-[6.4px] bg-black" />
        <span className="h-4 w-[6.4px] bg-black" />
      </span>
    </button>
  );
}
