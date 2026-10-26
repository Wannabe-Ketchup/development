import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import { PomodoroSession } from './PomodoroSession';
import { pausePomodoro, resumePomodoro, startPomodoro } from '@/api/timer';

vi.mock('@/api/timer');

const mockStartPomodoro = startPomodoro as unknown as Mock;
const mockPausePomodoro = pausePomodoro as unknown as Mock;
const mockResumePomodoro = resumePomodoro as unknown as Mock;

afterEach(() => {
  vi.clearAllMocks();
});

describe('PomodoroSession', () => {
  it('대기 중인 방에서는 idle 라벨과 start 버튼이 보이고, start를 누르면 시작 요청을 보낸다', () => {
    // given
    mockStartPomodoro.mockResolvedValue(undefined);
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.IDLE}
        currentCycle={0}
        timerStatus="IDLE"
      />,
    );
    expect(screen.getByText('idle')).toBeTruthy();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'start' }));

    // then
    expect(mockStartPomodoro).toHaveBeenCalledWith('room-1');
  });

  it('진행 중인 방에서는 회차 라벨과 pause 버튼이 보이고 start 버튼은 보이지 않는다', () => {
    // when
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.FOCUS}
        currentCycle={1}
        timerStatus="RUNNING"
      />,
    );

    // then
    expect(screen.getByText('1st focus')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'pause' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
  });

  it('진행 중인 방에서 pause를 누르면 일시정지 요청을 보낸다', () => {
    // given
    mockPausePomodoro.mockResolvedValue(undefined);
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.BREAK}
        currentCycle={2}
        timerStatus="RUNNING"
      />,
    );

    // when
    fireEvent.click(screen.getByRole('button', { name: 'pause' }));

    // then
    expect(mockPausePomodoro).toHaveBeenCalledWith('room-1');
    expect(mockStartPomodoro).not.toHaveBeenCalled();
  });

  it('일시정지 중인 방에서는 회차 라벨과 resume 버튼이 보이고, resume을 누르면 재개 요청을 보낸다', () => {
    // given
    mockResumePomodoro.mockResolvedValue(undefined);
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.FOCUS}
        currentCycle={1}
        timerStatus="PAUSED"
      />,
    );
    expect(screen.getByText('1st focus')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'pause' })).toBeNull();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'resume' }));

    // then
    expect(mockResumePomodoro).toHaveBeenCalledWith('room-1');
  });

  it('일시정지 요청이 실패하면 pause 버튼을 다시 누를 수 있다', async () => {
    // given
    mockPausePomodoro.mockRejectedValue(new Error('실패'));
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.FOCUS}
        currentCycle={1}
        timerStatus="RUNNING"
      />,
    );

    // when
    fireEvent.click(screen.getByRole('button', { name: 'pause' }));

    // then
    await vi.waitFor(() => {
      expect(
        screen.getByRole<HTMLButtonElement>('button', { name: 'pause' })
          .disabled,
      ).toBe(false);
    });
  });

  it('start를 누른 뒤 진행 중을 거쳐 대기로 돌아오면 start 버튼을 다시 누를 수 있다', () => {
    // given
    mockStartPomodoro.mockResolvedValue(undefined);
    const { rerender } = render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.IDLE}
        currentCycle={0}
        timerStatus="IDLE"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'start' }).disabled,
    ).toBe(true);

    // when
    rerender(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.FOCUS}
        currentCycle={1}
        timerStatus="RUNNING"
      />,
    );
    rerender(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.IDLE}
        currentCycle={0}
        timerStatus="IDLE"
      />,
    );

    // then
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'start' }).disabled,
    ).toBe(false);
  });
});
