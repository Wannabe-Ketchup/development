import { useState } from 'react';
import TriangleSvg from '@/assets/triangle.svg?react';
import { startPomodoro } from '@/api/timer';
import { IconButton } from '@/components/IconButton';
import { ICON_PILL_CONTENT_CLASS_NAME } from '@/components/SquigglePill';

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

  // 모든 화면에서 아이콘만 보이는 지름 48 원형 버튼이다. 접근 가능한 이름은 label로 남긴다
  return (
    <IconButton
      label="start"
      icon={TriangleSvg}
      disabled={isStarting}
      onClick={handleClick}
      className={ICON_PILL_CONTENT_CLASS_NAME}
      // 삼각형은 무게중심이 왼쪽에 있어 원 안에서 오른쪽으로 조금 민다
      iconClassName="ml-0.5"
    />
  );
}
