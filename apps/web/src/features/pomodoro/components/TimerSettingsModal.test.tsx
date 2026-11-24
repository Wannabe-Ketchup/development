import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Timer } from '@pomodoro/shared';
import { changeTimerDuration } from '@/api/timer';
import { TimerSettingsModal } from './TimerSettingsModal';

vi.mock('@/api/timer');

const IDLE_TIMER: Timer = {
  status: 'IDLE',
  focusTimeSec: 1500,
  breakTimeSec: 300,
  totalCycle: 4,
  timerStartedAt: null,
  remainingTimeSec: 1500,
};

function renderModal(options?: { isEditable?: boolean; onClose?: () => void }) {
  return render(
    <TimerSettingsModal
      roomId="r1"
      timer={IDLE_TIMER}
      isEditable={options?.isEditable ?? true}
      onClose={options?.onClose ?? (() => {})}
    />,
  );
}

describe('TimerSettingsModal', () => {
  beforeEach(() => {
    vi.mocked(changeTimerDuration).mockReset();
  });

  it('시간을 늘리고 저장하기를 누르면 바꾼 집중·휴식 시간으로 저장을 요청하고 모달이 닫힌다', async () => {
    // given
    vi.mocked(changeTimerDuration).mockResolvedValue({ ok: true });
    const handleClose = vi.fn();
    renderModal({ onClose: handleClose });

    // when
    fireEvent.click(screen.getByRole('button', { name: '집중 시간 늘리기' }));
    fireEvent.click(screen.getByRole('button', { name: '휴식 시간 늘리기' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    });

    // then
    expect(changeTimerDuration).toHaveBeenCalledWith('r1', {
      focusMinutes: 30,
      breakMinutes: 6,
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('대기 상태가 아니면 현재 시간만 보이고 조절·저장할 수 없다', () => {
    // given
    renderModal({ isEditable: false });

    // when
    for (const name of [
      '집중 시간 늘리기',
      '집중 시간 줄이기',
      '휴식 시간 늘리기',
      '휴식 시간 줄이기',
      '저장하기',
    ]) {
      fireEvent.click(screen.getByRole('button', { name }));
    }

    // then
    expect(screen.getByRole('group', { name: '집중' }).textContent).toContain(
      '25분',
    );
    expect(screen.getByRole('group', { name: '휴식' }).textContent).toContain(
      '5분',
    );
    for (const name of [
      '집중 시간 늘리기',
      '집중 시간 줄이기',
      '휴식 시간 늘리기',
      '휴식 시간 줄이기',
      '저장하기',
    ]) {
      expect(
        screen.getByRole('button', { name }).getAttribute('aria-disabled'),
      ).toBe('true');
    }
    expect(changeTimerDuration).not.toHaveBeenCalled();
  });

  it('진행 중이라 저장이 거절되면 모달에 알리고 닫히지 않는다', async () => {
    // given
    vi.mocked(changeTimerDuration).mockResolvedValue({
      ok: false,
      reason: 'running',
    });
    const handleClose = vi.fn();
    renderModal({ onClose: handleClose });

    // when
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    });

    // then
    expect((await screen.findByRole('alert')).textContent).toBe(
      '진행 중에는 바꿀 수 없어요',
    );
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('저장 중에는 저장하기를 다시 눌러도 요청하지 않는다', async () => {
    // given
    vi.mocked(changeTimerDuration).mockReturnValue(new Promise(() => {}));
    renderModal();
    const saveButton = screen.getByRole('button', { name: '저장하기' });

    // when
    await act(async () => {
      fireEvent.click(saveButton);
    });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // then
    expect(changeTimerDuration).toHaveBeenCalledTimes(1);
  });

  it('편집 중 방이 대기가 아니게 되면 서버의 현재 시간을 읽기 전용으로 보여 준다', () => {
    // given: 편집 중
    const serverTimer = { ...IDLE_TIMER, focusTimeSec: 1800 };
    const { rerender } = render(
      <TimerSettingsModal
        roomId="r1"
        timer={IDLE_TIMER}
        isEditable
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '집중 시간 늘리기' }));
    expect(screen.getByRole('group', { name: '집중' }).textContent).toContain(
      '30분',
    );

    // when: 진행 중으로 바뀌고 서버 값은 35분
    rerender(
      <TimerSettingsModal
        roomId="r1"
        timer={{ ...serverTimer, focusTimeSec: 2100 }}
        isEditable={false}
        onClose={() => {}}
      />,
    );

    // then
    expect(screen.getByRole('group', { name: '집중' }).textContent).toContain(
      '35분',
    );
    for (const name of [
      '집중 시간 늘리기',
      '집중 시간 줄이기',
      '휴식 시간 늘리기',
      '휴식 시간 줄이기',
      '저장하기',
    ]) {
      expect(
        screen.getByRole('button', { name }).getAttribute('aria-disabled'),
      ).toBe('true');
    }

    // when: 다시 대기로 돌아오고 서버 값은 40분
    rerender(
      <TimerSettingsModal
        roomId="r1"
        timer={{ ...serverTimer, focusTimeSec: 2400 }}
        isEditable
        onClose={() => {}}
      />,
    );

    // then: 편집 값이 그때의 서버 값으로 맞춰진다
    expect(screen.getByRole('group', { name: '집중' }).textContent).toContain(
      '40분',
    );
    expect(
      screen
        .getByRole('button', { name: '저장하기' })
        .getAttribute('aria-disabled'),
    ).toBe('false');
  });
});
