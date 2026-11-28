import { useRef, useState } from 'react';
import type { Timer, TimerDurationKind } from '@pomodoro/shared';
import { changeTimerDuration } from '@/api/timer';
import {
  canStepDuration,
  stepDuration,
  type StepDirection,
} from '../lib/timer-duration';

const SECONDS_PER_MINUTE = 60;

export type SaveStatus = 'idle' | 'saving' | 'running-error' | 'failed';

interface UseTimerDurationFormParams {
  roomId: string;
  // 서버의 현재 타이머 (SSE로 갱신)
  timer: Timer;
  // room.mode === IDLE
  isEditable: boolean;
}

interface Durations {
  focusMinutes: number;
  breakMinutes: number;
}

function toDurations(timer: Timer): Durations {
  return {
    focusMinutes: timer.focusTimeSec / SECONDS_PER_MINUTE,
    breakMinutes: timer.breakTimeSec / SECONDS_PER_MINUTE,
  };
}

// 편집 값은 마운트 시 서버 값으로 시작하고, SSE로 서버 값이 바뀌어도 덮어쓰지 않는다.
// 읽기 전용이면 서버 값을 그대로 보여 주고, 다시 편집할 수 있게 되면 그때의 서버 값으로 맞춘다
export function useTimerDurationForm({
  roomId,
  timer,
  isEditable,
}: UseTimerDurationFormParams) {
  const [editedDurations, setEditedDurations] = useState(() =>
    toDurations(timer),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [wasEditable, setWasEditable] = useState(isEditable);
  // 같은 틱의 중복 클릭은 state로 막을 수 없어 ref로 막는다
  const isSavingRef = useRef(false);

  if (wasEditable !== isEditable) {
    setWasEditable(isEditable);
    setSaveStatus('idle');
    if (isEditable) setEditedDurations(toDurations(timer));
  }

  const { focusMinutes, breakMinutes } = isEditable
    ? editedDurations
    : toDurations(timer);

  const minutesByKind = { focus: focusMinutes, break: breakMinutes };

  const canStep = (kind: TimerDurationKind, direction: StepDirection) =>
    isEditable &&
    saveStatus !== 'saving' &&
    canStepDuration(kind, minutesByKind[kind], direction);

  const step = (kind: TimerDurationKind, direction: StepDirection) => {
    if (!canStep(kind, direction)) return;
    const nextMinutes = stepDuration(kind, minutesByKind[kind], direction);
    setEditedDurations({
      ...editedDurations,
      [kind === 'focus' ? 'focusMinutes' : 'breakMinutes']: nextMinutes,
    });
    if (!isSavingRef.current) setSaveStatus('idle');
  };

  // 저장됐으면 true. 저장 중이거나 읽기 전용이면 요청하지 않고 false
  const save = async (): Promise<boolean> => {
    if (!isEditable || isSavingRef.current) return false;
    isSavingRef.current = true;
    setSaveStatus('saving');
    const result = await changeTimerDuration(roomId, editedDurations);
    isSavingRef.current = false;
    if (result.ok) {
      setSaveStatus('idle');
      return true;
    }
    setSaveStatus(result.reason === 'running' ? 'running-error' : 'failed');
    return false;
  };

  return { focusMinutes, breakMinutes, canStep, step, saveStatus, save };
}
