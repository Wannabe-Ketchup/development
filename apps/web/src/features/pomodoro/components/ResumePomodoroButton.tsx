import { useState } from 'react';
import { resumePomodoro } from '@/api/timer';
import { PILL_CONTENT_CLASS_NAME } from './SquigglePill';

interface ResumePomodoroButtonProps {
  roomId: string;
}

export function ResumePomodoroButton({ roomId }: ResumePomodoroButtonProps) {
  const [isResuming, setIsResuming] = useState(false);

  // 성공하면 SSE로 status가 바뀌어 pause 버튼으로 교체되므로 실패했을 때만 되돌린다
  const handleClick = async () => {
    setIsResuming(true);
    try {
      await resumePomodoro(roomId);
    } catch {
      setIsResuming(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isResuming}
      onClick={handleClick}
      className={PILL_CONTENT_CLASS_NAME}
    >
      resume
      {/* ▶ 아이콘: start 버튼과 같은 높이(16px)의 삼각형 */}
      <span
        aria-hidden="true"
        className="h-4 w-3.5 bg-black [clip-path:polygon(0_0,100%_50%,0_100%)]"
      />
    </button>
  );
}
