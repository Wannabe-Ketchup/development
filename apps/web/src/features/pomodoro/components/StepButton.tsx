import { WobblyBox } from '@squiggle-line/react';
import MinusSvg from '@/assets/minus.svg?react';
import PlusSvg from '@/assets/plus.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';

// 원 테두리는 다른 테두리처럼 squiggle로 그리고, svg에는 −/+ 기호만 둔다
const CIRCLE_WOBBLY = {
  wiggle: 4,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 3,
  borderRadius: 999,
  pathClassName: 'fill-white stroke-black',
};

const STEP_ICONS = { minus: MinusSvg, plus: PlusSvg };

interface StepButtonProps {
  label: string;
  icon: 'minus' | 'plus';
  // 한도에 닿았거나 읽기 전용이다. disabled 대신 aria-disabled라 포커스가 사라지지 않는다
  isDisabled: boolean;
  onClick: () => void;
}

// 손그림 원형 -/+ 버튼. 호버·누름에도 모양과 색은 바뀌지 않는다
export function StepButton({
  label,
  icon,
  isDisabled,
  onClick,
}: StepButtonProps) {
  return (
    <WobblyBox
      {...CIRCLE_WOBBLY}
      className={cn(
        'size-9 in-[.compact-safe-area]:size-12',
        isDisabled && 'opacity-40',
      )}
    >
      <IconButton
        label={label}
        icon={STEP_ICONS[icon]}
        aria-disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) onClick();
        }}
        // relative여야 흰 채우기가 기호를 덮지 않는다
        className="relative flex size-9 items-center justify-center text-black in-[.compact-safe-area]:size-12 aria-[disabled=true]:cursor-default"
        iconClassName="size-full"
      />
    </WobblyBox>
  );
}
