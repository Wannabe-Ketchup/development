import { useState } from 'react';
import TriangleSvg from '@/assets/triangle.svg?react';
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
      <TriangleSvg aria-hidden="true" />
    </button>
  );
}
