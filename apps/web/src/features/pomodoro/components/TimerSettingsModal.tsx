import { useId } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { TIMER_DURATION_RULE, type Timer } from '@pomodoro/shared';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import {
  useTimerDurationForm,
  type SaveStatus,
} from '../hooks/useTimerDurationForm';
import { DurationStepper } from './DurationStepper';

const SAVE_BUTTON_WOBBLY = {
  wiggle: 8,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 30,
  pathClassName: 'fill-none stroke-black',
};

// 범위는 shared 규칙에서 가져와 규칙이 바뀌면 문구도 함께 바뀌게 한다
const FOCUS_RULE = TIMER_DURATION_RULE.focus;
const BREAK_RULE = TIMER_DURATION_RULE.break;
const DURATION_RANGE_DESCRIPTION = `집중은 ${FOCUS_RULE.minMinutes}~${FOCUS_RULE.maxMinutes}분, 휴식은 ${BREAK_RULE.minMinutes}~${BREAK_RULE.maxMinutes}분으로 맞출 수 있어요`;
const LOCKED_DESCRIPTION = '뽀모도로 진행 중에는 설정을 바꿀 수 없어요';

const SAVE_ERROR_MESSAGES: Partial<Record<SaveStatus, string>> = {
  'running-error': '진행 중에는 바꿀 수 없어요',
  failed: '저장하지 못했어요',
};

interface TimerSettingsModalProps {
  roomId: string;
  timer: Timer;
  // 대기 상태일 때만 바꿀 수 있다. 아니면 현재 값만 보여 준다
  isEditable: boolean;
  onClose: () => void;
}

export function TimerSettingsModal({
  roomId,
  timer,
  isEditable,
  onClose,
}: TimerSettingsModalProps) {
  const titleId = useId();
  const { focusMinutes, breakMinutes, canStep, step, saveStatus, save } =
    useTimerDurationForm({ roomId, timer, isEditable });

  const isSaveDisabled = !isEditable || saveStatus === 'saving';
  const errorMessage = SAVE_ERROR_MESSAGES[saveStatus];

  const handleSave = async () => {
    if (await save()) onClose();
  };

  return (
    <Modal labelledBy={titleId} onClose={onClose} className="w-125 gap-4">
      <div className="flex w-full items-center justify-between">
        <h2 id={titleId} className="text-title leading-[normal]">
          시간 설정
        </h2>
        <IconButton
          label="닫기"
          icon={CloseSvg}
          onClick={onClose}
          className="flex size-6 items-center justify-center in-[.compact-safe-area]:-m-3 in-[.compact-safe-area]:size-12"
        />
      </div>
      <p className="text-body-sm leading-[normal] text-gray">
        {isEditable ? DURATION_RANGE_DESCRIPTION : LOCKED_DESCRIPTION}
      </p>
      <DurationStepper
        label="집중"
        minutes={focusMinutes}
        canDecrease={canStep('focus', 'decrease')}
        canIncrease={canStep('focus', 'increase')}
        isLocked={!isEditable}
        onDecrease={() => step('focus', 'decrease')}
        onIncrease={() => step('focus', 'increase')}
      />
      <DurationStepper
        label="휴식"
        minutes={breakMinutes}
        canDecrease={canStep('break', 'decrease')}
        canIncrease={canStep('break', 'increase')}
        isLocked={!isEditable}
        onDecrease={() => step('break', 'decrease')}
        onIncrease={() => step('break', 'increase')}
      />
      {errorMessage && (
        <p role="alert" className="text-body-sm leading-[normal] text-error">
          {errorMessage}
        </p>
      )}
      <WobblyBox {...SAVE_BUTTON_WOBBLY} className="w-full">
        <button
          type="button"
          aria-disabled={isSaveDisabled}
          onClick={() => {
            if (!isSaveDisabled) void handleSave();
          }}
          className="flex h-15 w-full items-center justify-center rounded-[30px] bg-tomato-body-4 text-title text-white aria-disabled:cursor-default aria-disabled:opacity-50"
        >
          저장하기
        </button>
      </WobblyBox>
    </Modal>
  );
}
