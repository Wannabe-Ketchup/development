import { useId } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { StepButton } from './StepButton';

const VALUE_BOX_WOBBLY = {
  wiggle: 4,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 3.5,
  borderRadius: 14,
  pathClassName: 'fill-none stroke-black',
};

interface DurationStepperProps {
  // "집중" | "휴식"
  label: string;
  minutes: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function DurationStepper({
  label,
  minutes,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: DurationStepperProps) {
  const labelId = useId();

  return (
    <fieldset aria-labelledby={labelId} className="flex items-center gap-7">
      <span
        id={labelId}
        className="w-16 font-gaegu text-[30px] tracking-[0.04em]"
      >
        {label}
      </span>
      <div className="flex items-center gap-3">
        <StepButton
          label={`${label} 시간 줄이기`}
          icon="minus"
          isDisabled={!canDecrease}
          onClick={onDecrease}
        />
        <WobblyBox {...VALUE_BOX_WOBBLY}>
          {/* output은 role status라 값이 바뀌면 "30분"이 발화된다 */}
          <output className="flex h-16 w-28 items-baseline justify-center gap-[3px] rounded-[14px] bg-white pt-1.5 font-gaegu">
            <span className="text-[38px] tracking-[0.04em]">{minutes}</span>
            <span className="text-2xl tracking-[0.04em]">분</span>
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
