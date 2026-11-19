import type { SVGProps } from 'react';
import MinusSvg from '@/assets/minus.svg?react';
import MinusPressedSvg from '@/assets/minus-pressed.svg?react';
import PlusSvg from '@/assets/plus.svg?react';
import PlusPressedSvg from '@/assets/plus-pressed.svg?react';
import { IconButton } from '@/components/IconButton';

// Figma svg 루트에 인라인 display:block이 있어 svg에 hidden 클래스를 걸면 지지 않는다.
// 그래서 기본·누름 모양은 각각 span으로 감싸 span의 표시를 바꾼다
function MinusIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <span aria-hidden="true" className={className}>
      <span className="block group-active:group-aria-[disabled=false]:hidden">
        <MinusSvg {...props} />
      </span>
      <span className="hidden group-active:group-aria-[disabled=false]:block">
        <MinusPressedSvg {...props} />
      </span>
    </span>
  );
}

function PlusIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <span aria-hidden="true" className={className}>
      <span className="block group-active:group-aria-[disabled=false]:hidden">
        <PlusSvg {...props} />
      </span>
      <span className="hidden group-active:group-aria-[disabled=false]:block">
        <PlusPressedSvg {...props} />
      </span>
    </span>
  );
}

const STEP_ICONS = { minus: MinusIcon, plus: PlusIcon };

interface StepButtonProps {
  label: string;
  icon: 'minus' | 'plus';
  // 한도에 닿았거나 읽기 전용이다. disabled 대신 aria-disabled라 포커스가 사라지지 않는다
  isDisabled: boolean;
  onClick: () => void;
}

// 손그림 원형 -/+ 버튼. 누르는 동안 빨간 누름 모양으로 바뀐다
export function StepButton({
  label,
  icon,
  isDisabled,
  onClick,
}: StepButtonProps) {
  return (
    <IconButton
      label={label}
      icon={STEP_ICONS[icon]}
      aria-disabled={isDisabled}
      onClick={() => {
        if (!isDisabled) onClick();
      }}
      className="group relative size-13 aria-[disabled=true]:cursor-default aria-[disabled=true]:opacity-40"
      iconClassName="block"
    />
  );
}
