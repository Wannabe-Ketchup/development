import { useState } from 'react';
import ResetSvg from '@/assets/reset.svg?react';
import { resetPomodoro } from '@/api/timer';
import { IconButton } from '@/components/IconButton';
import { SquigglePill } from '@/components/SquigglePill';

interface ResetPomodoroButtonProps {
  roomId: string;
  // 대기 중이면 false. 모습은 그대로 두고 눌러도 요청하지 않는다
  isResettable: boolean;
}

export function ResetPomodoroButton({
  roomId,
  isResettable,
}: ResetPomodoroButtonProps) {
  const [isResetting, setIsResetting] = useState(false);

  // 성공해도 버튼이 그대로 남으므로 결과와 관계없이 pending을 푼다. 상태는 SSE로 들어온다
  const handleClick = async () => {
    if (!isResettable || isResetting) return;
    setIsResetting(true);
    try {
      await resetPomodoro(roomId);
    } catch {
      // 기존 조작 버튼과 같이 따로 알리지 않는다
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SquigglePill>
      <IconButton
        label="리셋"
        icon={ResetSvg}
        aria-disabled={!isResettable || isResetting}
        onClick={handleClick}
        className="relative flex size-14 items-center justify-center text-black"
      />
    </SquigglePill>
  );
}
