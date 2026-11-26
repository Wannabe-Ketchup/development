import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import Pomodoro from './page';
import { enterRoom } from '@/api/room';
import { useRoomId } from '@/lib/room-id';
import { useRoomSSE } from './hooks/useRoomSSE';

vi.mock('@/api/room');
vi.mock('@/lib/room-id');
vi.mock('./hooks/useRoomSSE');

const mockEnterRoom = enterRoom as unknown as Mock;
const mockUseRoomId = useRoomId as unknown as Mock;
const mockUseRoomSSE = useRoomSSE as unknown as Mock;

describe('Pomodoro 페이지', () => {
  const existingParticipant = {
    id: 'p-1',
    nickname: '졸린토마토',
    statusMessage: '',
    completedCycles: 0,
  };
  const selfParticipant = { id: 'p-2', nickname: '배고픈토마토' };

  const room: Room = {
    roomId: 'room-1',
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
    timer: {
      status: 'IDLE',
      focusTimeSec: 1500,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: null,
      remainingTimeSec: 1500,
    },
    // 실제 서버는 입장(join)을 먼저 처리한 뒤 응답을 만들기 때문에,
    // 본인도 이미 이 시점의 participants에 포함되어 있다.
    participants: [
      existingParticipant,
      { ...selfParticipant, statusMessage: '', completedCycles: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRoomId.mockReturnValue('room-1');
    mockUseRoomSSE.mockReturnValue({ status: 'connecting' });
  });

  it('입장 API 응답 후 SSE가 확정되기 전까지는 본인 좌석이 흐리게 표시되고 로딩 표시가 함께 보인다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
    mockUseRoomSSE.mockReturnValue({ status: 'connecting' });

    // when
    render(<Pomodoro />);

    // then
    await waitFor(() => {
      expect(screen.getByText(existingParticipant.nickname)).toBeTruthy();
      expect(screen.getByText(selfParticipant.nickname)).toBeTruthy();
    });
    expect(screen.getByTestId('self-seat-pending')).toBeTruthy();
  });

  it('SSE로 room_state를 수신하면 본인 좌석의 흐림 처리와 로딩 표시가 사라진다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
    let emitRoomState: (
      nextRoom: Room,
      change: { isReset: boolean },
    ) => void = () => {};
    mockUseRoomSSE.mockImplementation(
      (
        _roomId: string,
        _isEntered: boolean,
        onRoomState: (nextRoom: Room, change: { isReset: boolean }) => void,
      ) => {
        emitRoomState = onRoomState;
        return { status: 'connected' };
      },
    );

    // when
    render(<Pomodoro />);
    await waitFor(() => screen.getByText(selfParticipant.nickname));
    const confirmedRoom: Room = {
      ...room,
      participants: [
        existingParticipant,
        { ...selfParticipant, statusMessage: '', completedCycles: 0 },
      ],
    };
    emitRoomState(confirmedRoom, { isReset: false });

    // then
    await waitFor(() => {
      expect(screen.queryByTestId('self-seat-pending')).toBeNull();
    });
  });

  it('리셋으로 바뀐 방 상태를 받으면 대기 화면이 되고 알림음이 울리지 않는다', async () => {
    // given
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const runningRoom: Room = {
      ...room,
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
      timer: {
        ...room.timer,
        status: 'RUNNING',
        timerStartedAt: '2026-11-01T10:00:00.000Z',
      },
    };
    mockEnterRoom.mockResolvedValue({
      participant: selfParticipant,
      room: runningRoom,
    });
    let emitRoomState: (
      nextRoom: Room,
      change: { isReset: boolean },
    ) => void = () => {};
    mockUseRoomSSE.mockImplementation(
      (
        _roomId: string,
        _isEntered: boolean,
        onRoomState: (nextRoom: Room, change: { isReset: boolean }) => void,
      ) => {
        emitRoomState = onRoomState;
        return { status: 'connected' };
      },
    );
    render(<Pomodoro />);
    await waitFor(() => screen.getByText('1st focus'));

    // when
    emitRoomState(room, { isReset: true });

    // then
    await waitFor(() => {
      expect(screen.getByText('idle')).toBeTruthy();
    });
    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('SSE 연결이 실패하면 에러 상태를 표시한다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
    mockUseRoomSSE.mockReturnValue({ status: 'error' });

    // when
    render(<Pomodoro />);

    // then
    await waitFor(() => {
      expect(screen.getByTestId('sse-error')).toBeTruthy();
    });
  });

  it('방 상태의 참가자 목록에서 내가 빠지면 다른 방에 입장해서 이 방에서 퇴장되었다는 안내가 보이고 실시간 연결을 끊는다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
    let emitRoomState: (
      nextRoom: Room,
      change: { isReset: boolean },
    ) => void = () => {};
    mockUseRoomSSE.mockImplementation(
      (
        _roomId: string,
        _isEntered: boolean,
        onRoomState: (nextRoom: Room, change: { isReset: boolean }) => void,
      ) => {
        emitRoomState = onRoomState;
        return { status: 'connected' };
      },
    );
    render(<Pomodoro />);
    await waitFor(() => screen.getByText(selfParticipant.nickname));

    // when
    act(() => {
      emitRoomState(
        { ...room, participants: [existingParticipant] },
        { isReset: false },
      );
    });

    // then
    await waitFor(() => {
      expect(screen.getByTestId('moved-room-notice')).toBeTruthy();
    });
    const lastCallArgs = mockUseRoomSSE.mock.calls.at(-1);
    expect(lastCallArgs?.[1]).toBe(false);
  });

  it('퇴장 안내가 보이면 실시간 연결 실패 안내는 보이지 않는다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
    let emitRoomState: (
      nextRoom: Room,
      change: { isReset: boolean },
    ) => void = () => {};
    mockUseRoomSSE.mockImplementation(
      (
        _roomId: string,
        _isEntered: boolean,
        onRoomState: (nextRoom: Room, change: { isReset: boolean }) => void,
      ) => {
        emitRoomState = onRoomState;
        return { status: 'error' };
      },
    );
    render(<Pomodoro />);
    await waitFor(() => screen.getByTestId('sse-error'));

    // when
    act(() => {
      emitRoomState(
        { ...room, participants: [existingParticipant] },
        { isReset: false },
      );
    });

    // then
    await waitFor(() => {
      expect(screen.getByTestId('moved-room-notice')).toBeTruthy();
    });
    expect(screen.queryByTestId('sse-error')).toBeNull();
  });

  it("휴식 중인 방에 입장하면 참여자의 상태 메시지 자리에 '휴식 중…'이 보인다", async () => {
    // given
    const breakRoom: Room = { ...room, mode: ROOM_MODE.BREAK };
    mockEnterRoom.mockResolvedValue({
      participant: selfParticipant,
      room: breakRoom,
    });

    // when
    render(<Pomodoro />);

    // then
    const expectedMessage = '휴식 중…';
    await waitFor(() => {
      expect(screen.getAllByText(expectedMessage).length).toBeGreaterThan(0);
    });
  });

  it.each([
    ['집중', ROOM_MODE.FOCUS],
    ['대기', ROOM_MODE.IDLE],
  ])(
    '%s 중인 방에 입장하면 참여자의 원래 상태 메시지가 보인다',
    async (_, mode) => {
      // given
      const statusMessage = '공부중';
      const roomInMode: Room = {
        ...room,
        mode,
        participants: [{ ...existingParticipant, statusMessage }],
      };
      mockEnterRoom.mockResolvedValue({
        participant: selfParticipant,
        room: roomInMode,
      });

      // when
      render(<Pomodoro />);

      // then
      expect(await screen.findByText(statusMessage)).toBeTruthy();
      expect(screen.queryByText('휴식 중…')).toBeNull();
    },
  );
});
