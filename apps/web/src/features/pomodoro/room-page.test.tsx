import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { ChatMessage, Room } from '@pomodoro/shared';
import { sendChatMessage } from '@/api/chat';
import { enterRoom } from '@/api/room';
import { useRoomId } from '@/lib/room-id';
import { useRoomSSE } from './hooks/useRoomSSE';
import RoomPage from './room-page';

vi.mock('@/api/chat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/chat')>()),
  sendChatMessage: vi.fn(),
}));
vi.mock('@/api/room');
vi.mock('@/lib/room-id');
vi.mock('./hooks/useRoomSSE');

const mockEnterRoom = enterRoom as unknown as Mock;
const mockSendChatMessage = vi.mocked(sendChatMessage);
const mockUseRoomId = useRoomId as unknown as Mock;
const mockUseRoomSSE = useRoomSSE as unknown as Mock;

const DESKTOP_WIDTH = 1440;
const TABLET_WIDTH = 900;

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
  participants: [{ ...selfParticipant, statusMessage: '', completedCycles: 0 }],
};
const otherMessage: ChatMessage = {
  id: 1,
  senderId: 'p-1',
  nickname: '졸린토마토',
  content: '안녕하세요',
  sentAt: '2026-01-01T00:00:00.000Z',
};

function resizeWindow(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

// 입장 응답 뒤 SSE room_state가 와서 입장이 확정된 상태까지 만든다. 이후 SSE 이벤트를 흉내 내는 함수를 돌려준다
async function renderConfirmedRoom() {
  mockEnterRoom.mockResolvedValue({ participant: selfParticipant, room });
  const handlers = {
    onRoomState: (_room: Room, _change: { isReset: boolean }) => {},
    onChatMessage: (_message: ChatMessage) => {},
    onChatHistory: (_messages: ChatMessage[]) => {},
  };
  mockUseRoomSSE.mockImplementation(
    (
      _roomId: string,
      _isEntered: boolean,
      onRoomState: typeof handlers.onRoomState,
      onChatMessage: typeof handlers.onChatMessage,
      onChatHistory: typeof handlers.onChatHistory,
    ) => {
      handlers.onRoomState = onRoomState;
      handlers.onChatMessage = onChatMessage;
      handlers.onChatHistory = onChatHistory;
      return { status: 'connected' };
    },
  );
  render(<RoomPage />);
  await waitFor(() => screen.getByText(selfParticipant.nickname));
  act(() => handlers.onRoomState(room, { isReset: false }));
  return handlers;
}

describe('RoomPage', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRoomId.mockReturnValue('room-1');
    mockUseRoomSSE.mockReturnValue({ status: 'connecting' });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    resizeWindow(DESKTOP_WIDTH);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resizeWindow(originalWidth);
  });

  it('창 너비가 데스크톱 ↔ 중간으로 바뀌어도 입장 요청은 한 번이고 실시간 연결을 다시 맺지 않는다', async () => {
    // given
    await renderConfirmedRoom();
    const callsBeforeResize = mockUseRoomSSE.mock.calls.length;

    // when
    resizeWindow(TABLET_WIDTH);
    expect(screen.queryByTestId('desktop-room')).toBeNull();
    resizeWindow(DESKTOP_WIDTH);

    // then
    // 세션이 다시 시작됐다면 입장 전(isEntered false) 상태로 SSE 훅이 다시 불린다
    const callsAfterResize = mockUseRoomSSE.mock.calls.slice(callsBeforeResize);
    expect(callsAfterResize.every(([, isEntered]) => isEntered)).toBe(true);
    expect(mockEnterRoom).toHaveBeenCalledTimes(1);
    expect(screen.getByText(selfParticipant.nickname)).toBeTruthy();
  });

  it('화면이 바뀌어도 쓰던 채팅 내용이 남아 있다', async () => {
    // given
    await renderConfirmedRoom();
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));
    fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
      target: { value: '쓰던 내용' },
    });

    // when
    resizeWindow(TABLET_WIDTH);
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));

    // then
    expect(
      screen.getByRole<HTMLInputElement>('textbox', { name: '메시지' }).value,
    ).toBe('쓰던 내용');
  });

  it('화면이 바뀌어도 이미 읽은 메시지에 안 읽음 표시가 다시 뜨지 않는다', async () => {
    // given
    const handlers = await renderConfirmedRoom();
    act(() => handlers.onChatHistory([]));
    act(() => handlers.onChatMessage(otherMessage));
    expect(screen.getByText('안 읽은 메시지 있음')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));
    fireEvent.click(screen.getByRole('button', { name: '채팅 닫기' }));
    expect(screen.queryByText('안 읽은 메시지 있음')).toBeNull();

    // when
    resizeWindow(TABLET_WIDTH);

    // then
    expect(screen.queryByText('안 읽은 메시지 있음')).toBeNull();
    expect(screen.queryByTestId('chat-unread')).toBeNull();
  });

  it('데스크톱에서 투어가 열린 채 채팅을 열면 투어가 닫힌다', async () => {
    // given
    await renderConfirmedRoom();
    fireEvent.click(screen.getByRole('button', { name: 'how to use' }));
    screen.getByRole('dialog', { name: '뽀모도로 사용법' });

    // when
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));

    // then
    expect(
      screen.queryByRole('dialog', { name: '뽀모도로 사용법' }),
    ).toBeNull();
    expect(screen.getByRole('textbox', { name: '메시지' })).toBeTruthy();
  });

  it('보내는 중에 화면이 바뀌어도 같은 메시지를 한 번 더 보내지 않는다', async () => {
    // given
    let resolveSend: (message: ChatMessage) => void = () => {};
    mockSendChatMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );
    await renderConfirmedRoom();
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));
    fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
      target: { value: '보내는 중' },
    });
    fireEvent.click(screen.getByRole('button', { name: '보내기' }));

    // when
    resizeWindow(TABLET_WIDTH);
    fireEvent.click(screen.getByRole('button', { name: /^chat/ }));
    fireEvent.click(screen.getByRole('button', { name: '보내기' }));

    // then
    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);
    await act(async () =>
      resolveSend({
        ...otherMessage,
        id: 2,
        senderId: selfParticipant.id,
        content: '보내는 중',
      }),
    );
  });
});
