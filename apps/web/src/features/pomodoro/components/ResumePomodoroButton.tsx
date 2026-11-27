import { useState } from 'react';
import TriangleSvg from '@/assets/triangle.svg?react';
import { resumePomodoro } from '@/api/timer';
import { IconButton } from '@/components/IconButton';
import { ICON_PILL_CONTENT_CLASS_NAME } from '@/components/SquigglePill';

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

  // 모든 화면에서 아이콘만 보이는 지름 48 원형 버튼이다. 접근 가능한 이름은 label로 남긴다
  return (
    <IconButton
      label="resume"
      icon={TriangleSvg}
      disabled={isResuming}
      onClick={handleClick}
      className={ICON_PILL_CONTENT_CLASS_NAME}
      // 삼각형은 무게중심이 왼쪽에 있어 원 안에서 오른쪽으로 조금 민다
      iconClassName="ml-0.5"
    />
  );
}
