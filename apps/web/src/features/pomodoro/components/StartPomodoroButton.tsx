import { useState } from 'react';
import { startPomodoro } from '@/api/timer';
import { PILL_CONTENT_CLASS_NAME } from './SquigglePill';

interface StartPomodoroButtonProps {
  roomId: string;
}

export function StartPomodoroButton({ roomId }: StartPomodoroButtonProps) {
  const [isStarting, setIsStarting] = useState(false);

  // 성공하면 SSE로 mode가 바뀌어 pause 버튼으로 교체되므로 실패했을 때만 되돌린다
  const handleClick = async () => {
    setIsStarting(true);
    try {
      await startPomodoro(roomId);
    } catch {
      setIsStarting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isStarting}
      onClick={handleClick}
      className={PILL_CONTENT_CLASS_NAME}
    >
      start
      {/* ▶ 아이콘: Figma pause 아이콘 막대와 같은 높이(16px)의 삼각형 */}
      <span
        aria-hidden="true"
        className="h-4 w-3.5 bg-black [clip-path:polygon(0_0,100%_50%,0_100%)]"
      />
    </button>
  );
}
