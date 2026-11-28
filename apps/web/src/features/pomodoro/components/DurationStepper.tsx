import { useId } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { cn } from '@/lib/cn';
import { StepButton } from './StepButton';

const VALUE_BOX_WOBBLY = {
  wiggle: 4,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 3,
  borderRadius: 12,
  pathClassName: 'fill-none stroke-black',
};

interface DurationStepperProps {
  // "집중" | "휴식"
  label: string;
  minutes: number;
  canDecrease: boolean;
  canIncrease: boolean;
  // 진행 중이라 바꿀 수 없다. 값 상자도 -/+처럼 흐리게 보인다
  isLocked: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function DurationStepper({
  label,
  minutes,
  canDecrease,
  canIncrease,
  isLocked,
  onDecrease,
  onIncrease,
}: DurationStepperProps) {
  const labelId = useId();

  return (
    <fieldset
      aria-labelledby={labelId}
      className="flex w-full items-center justify-between"
    >
      <span id={labelId} className="text-body-lg">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <StepButton
          label={`${label} 시간 줄이기`}
          icon="minus"
          isDisabled={!canDecrease}
          onClick={onDecrease}
        />
        <WobblyBox
          {...VALUE_BOX_WOBBLY}
          className={cn(isLocked && 'opacity-40')}
        >
          {/* output은 role status라 값이 바뀌면 "30분"이 발화된다 */}
          {/* 이 폰트는 한글 "분"을 숫자 기준선보다 아래로 그려서, 기준선이 아니라 가운데로 맞춰야 두 글자의 아랫선이 맞는다 */}
          <output className="flex h-11 w-20 items-center justify-center gap-0.5 rounded-xl bg-white pt-0.5">
            <span className="text-title-sm">{minutes}</span>
            <span className="text-body-sm">분</span>
          </output>
        </WobblyBox>
        <StepButton
          label={`${label} 시간 늘리기`}
          icon="plus"
          isDisabled={!canIncrease}
          onClick={onIncrease}
        />
      </div>
    </fieldset>
  );
}
