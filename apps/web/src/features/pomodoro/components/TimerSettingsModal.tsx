import { useId } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import type { Timer } from '@pomodoro/shared';
import CloseSvg from '@/assets/close-settings.svg?react';
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
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      className="w-101 gap-[22px] pb-8"
    >
      <div className="flex w-full items-center justify-between">
        <h2 id={titleId} className="text-[32px] leading-[normal] text-black">
          설정
        </h2>
        <IconButton
          label="닫기"
          icon={CloseSvg}
          onClick={onClose}
          className="flex size-[26px] items-center justify-center"
        />
      </div>
      <DurationStepper
        label="집중"
        minutes={focusMinutes}
        canDecrease={canStep('focus', 'decrease')}
        canIncrease={canStep('focus', 'increase')}
        onDecrease={() => step('focus', 'decrease')}
        onIncrease={() => step('focus', 'increase')}
      />
      <DurationStepper
        label="휴식"
        minutes={breakMinutes}
        canDecrease={canStep('break', 'decrease')}
        canIncrease={canStep('break', 'increase')}
        onDecrease={() => step('break', 'decrease')}
        onIncrease={() => step('break', 'increase')}
      />
      {errorMessage && (
        <p role="alert" className="text-base leading-[normal] text-error">
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
          className="flex h-15 w-full items-center justify-center rounded-[30px] bg-tomato-body-4 font-gaegu text-[28px] tracking-[0.04em] text-black aria-disabled:cursor-default aria-disabled:opacity-50"
        >
          저장하기
        </button>
      </WobblyBox>
    </Modal>
  );
}
