import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import Pomodoro from './page';
import { enterRoom } from '@/api/room';
import { useRoomId } from './lib/room-id';
import { useRoomSSE } from './hooks/useRoomSSE';

vi.mock('@/api/room');
vi.mock('./lib/room-id');
vi.mock('./hooks/useRoomSSE');

const mockEnterRoom = enterRoom as unknown as Mock;
const mockUseRoomId = useRoomId as unknown as Mock;
const mockUseRoomSSE = useRoomSSE as unknown as Mock;

describe('Pomodoro 페이지', () => {
  const existingParticipant = {
    id: 'p-1',
    nickname: '졸린토마토',
    statusMessage: '',
    currentCycle: 0,
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
      { ...selfParticipant, statusMessage: '', currentCycle: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRoomId.mockReturnValue('room-1');
    mockUseRoomSSE.mockReturnValue({ status: 'connecting' });
  });

  it('roomId 없이 페이지에 진입하면 잘못된 링크 안내를 표시한다', () => {
    // given
    mockUseRoomId.mockReturnValue(null);

    // when
    render(<Pomodoro />);

    // then
    expect(mockEnterRoom).not.toHaveBeenCalled();
    expect(screen.getByTestId('invalid-room-link')).toBeTruthy();
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
    let emitRoomState: (nextRoom: Room) => void = () => {};
    mockUseRoomSSE.mockImplementation(
      (
        _roomId: string,
        _participantId: string,
        onRoomState: (nextRoom: Room) => void,
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
        { ...selfParticipant, statusMessage: '', currentCycle: 0 },
      ],
    };
    emitRoomState(confirmedRoom);

    // then
    await waitFor(() => {
      expect(screen.queryByTestId('self-seat-pending')).toBeNull();
    });
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
});
