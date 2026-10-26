import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import { PomodoroSession } from './PomodoroSession';
import { startPomodoro } from '@/api/timer';

vi.mock('@/api/timer');

const mockStartPomodoro = startPomodoro as unknown as Mock;

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
      />,
    );

    // then
    expect(screen.getByText('1st focus')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'pause' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
  });

  it('pause 버튼을 눌러도 시작 요청을 보내지 않는다', () => {
    // given
    render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.BREAK}
        currentCycle={2}
      />,
    );

    // when
    fireEvent.click(screen.getByRole('button', { name: 'pause' }));

    // then
    expect(mockStartPomodoro).not.toHaveBeenCalled();
  });

  it('start를 누른 뒤 진행 중을 거쳐 대기로 돌아오면 start 버튼을 다시 누를 수 있다', () => {
    // given
    mockStartPomodoro.mockResolvedValue(undefined);
    const { rerender } = render(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.IDLE}
        currentCycle={0}
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
      />,
    );
    rerender(
      <PomodoroSession
        roomId="room-1"
        mode={ROOM_MODE.IDLE}
        currentCycle={0}
      />,
    );

    // then
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'start' }).disabled,
    ).toBe(false);
  });
});
