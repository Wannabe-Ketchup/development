import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import type { CompactLayout } from '@/lib/viewport-mode';
import { CompactPomodoro } from './compact-page';
import { enterRoom } from '@/api/room';
import { useRoomId } from '@/lib/room-id';
import { useRoomSSE } from './hooks/useRoomSSE';
import { useRoomSession } from './hooks/useRoomSession';
import {
  MOBILE_COACH_MARK_STEPS,
  TABLET_COACH_MARK_STEPS,
} from './lib/coach-mark-steps';

vi.mock('@/api/room');
vi.mock('@/lib/room-id');
vi.mock('./hooks/useRoomSSE');

const mockEnterRoom = enterRoom as unknown as Mock;
const mockUseRoomId = useRoomId as unknown as Mock;
const mockUseRoomSSE = useRoomSSE as unknown as Mock;

// 폰은 참여자를 모두 그리고 화면 밖 참여자를 inert로 막는다. 화면 가운데에 보이는 참여자인지 본다
function isViewed(nickname: string): boolean {
  return !screen.getByText(nickname).closest('li')?.hasAttribute('inert');
}

function CompactPomodoroWithSession({ layout }: { layout: CompactLayout }) {
  return <CompactPomodoro layout={layout} session={useRoomSession()} />;
}

describe('CompactPomodoro', () => {
  const otherParticipant = {
    id: 'p-1',
    nickname: '졸린토마토',
    statusMessage: '',
    completedCycles: 0,
  };
  const selfParticipant = { id: 'p-2', nickname: '배고픈토마토' };
  const lastParticipant = {
    id: 'p-3',
    nickname: '느긋한토마토',
    statusMessage: '',
    completedCycles: 0,
  };

  const baseRoom: Room = {
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
    participants: [
      otherParticipant,
      { ...selfParticipant, statusMessage: '', completedCycles: 0 },
      lastParticipant,
    ],
  };

  // 입장 응답 뒤 SSE room_state가 와서 입장이 확정된 상태까지 만든다
  async function renderConfirmed(
    layout: 'mobile' | 'tablet',
    room: Room = baseRoom,
  ) {
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
    const view = render(<CompactPomodoroWithSession layout={layout} />);
    await waitFor(() => screen.getByText(selfParticipant.nickname));
    act(() => emitRoomState(room, { isReset: false }));
    return view;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseRoomId.mockReturnValue('room-1');
    mockUseRoomSSE.mockReturnValue({ status: 'connecting' });
    // jsdom에는 matchMedia가 없어 투어의 모션 설정 확인이 실패한다
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it('조명과 LP를 그리지 않고 저장된 다크 모드를 적용하지 않는다', async () => {
    // given
    localStorage.setItem('theme', 'dark');

    // when
    const { container } = await renderConfirmed('mobile');

    // then
    expect(screen.queryByRole('button', { name: /모드로 전환/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '음악 재생' })).toBeNull();
    expect(container.querySelector('.dark-mode-overlay')).toBeNull();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('mobile은 참여자 한 명과 이전·다음 버튼, tablet은 참여자 전원을 보여 준다', async () => {
    // given
    // when
    const mobile = await renderConfirmed('mobile');

    // then
    expect(isViewed(selfParticipant.nickname)).toBe(true);
    expect(isViewed(otherParticipant.nickname)).toBe(false);
    expect(isViewed(lastParticipant.nickname)).toBe(false);
    screen.getByRole('button', { name: '이전 참여자' });
    screen.getByRole('button', { name: '다음 참여자' });
    mobile.unmount();

    // when
    await renderConfirmed('tablet');

    // then
    expect(screen.getByText(otherParticipant.nickname)).toBeTruthy();
    expect(screen.getByText(selfParticipant.nickname)).toBeTruthy();
    expect(screen.getByText(lastParticipant.nickname)).toBeTruthy();
    expect(screen.queryByRole('button', { name: '다음 참여자' })).toBeNull();
  });

  it('mobile에서 다음 참여자 버튼을 누르면 다음 참여자로 넘어가고 끝에서는 더 넘어가지 않는다', async () => {
    // given
    await renderConfirmed('mobile');

    // when
    fireEvent.click(screen.getByRole('button', { name: '다음 참여자' }));

    // then
    expect(isViewed(lastParticipant.nickname)).toBe(true);
    // 앞에서 보던 본인은 화면 밖으로 밀려나 수정 버튼에 키보드가 닿지 않는다
    expect(isViewed(selfParticipant.nickname)).toBe(false);
    expect(screen.queryByRole('button', { name: '닉네임 수정' })).toBeNull();
    expect(
      screen
        .getByRole('button', { name: '다음 참여자' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.getByText('3명 중 3번째, 느긋한토마토')).toBeTruthy();
  });

  it('참여자가 1명이면 이전·다음 버튼이 없다', async () => {
    // given
    const soloRoom: Room = {
      ...baseRoom,
      participants: [
        { ...selfParticipant, statusMessage: '', completedCycles: 0 },
      ],
    };

    // when
    await renderConfirmed('mobile', soloRoom);

    // then
    expect(screen.queryByRole('button', { name: '이전 참여자' })).toBeNull();
    expect(screen.queryByRole('button', { name: '다음 참여자' })).toBeNull();
    expect(screen.queryByTestId('participant-dots')).toBeNull();
  });

  it.each([
    ['mobile', MOBILE_COACH_MARK_STEPS],
    ['tablet', TABLET_COACH_MARK_STEPS],
  ] as const)(
    '투어 단계마다 대상 요소가 화면에 있다 (%s)',
    async (layout, steps) => {
      // given
      await renderConfirmed(layout);

      // when
      fireEvent.click(screen.getByRole('button', { name: 'how to use' }));

      // then
      expect(steps).toHaveLength(5);
      for (const step of steps) {
        expect(
          document.querySelector(step.selector),
          `${step.id} 단계의 대상`,
        ).not.toBeNull();
      }
      screen.getByRole('dialog', { name: '뽀모도로 사용법' });
    },
  );

  it.each(['mobile', 'tablet'] as const)(
    '투어가 열린 채 채팅을 열면 투어가 닫힌다 (%s)',
    async (layout) => {
      // given
      await renderConfirmed(layout);
      fireEvent.click(screen.getByRole('button', { name: 'how to use' }));
      screen.getByRole('dialog', { name: '뽀모도로 사용법' });

      // when
      fireEvent.click(screen.getByRole('button', { name: /^chat/ }));

      // then
      expect(
        screen.queryByRole('dialog', { name: '뽀모도로 사용법' }),
      ).toBeNull();
      screen.getByRole('dialog', { name: '채팅' });
    },
  );

  it('mobile에서 다른 참여자를 보다가 투어를 열면 본인 화면으로 돌아온다', async () => {
    // given
    await renderConfirmed('mobile');
    fireEvent.click(screen.getByRole('button', { name: '다음 참여자' }));
    expect(isViewed(selfParticipant.nickname)).toBe(false);

    // when
    fireEvent.click(screen.getByRole('button', { name: 'how to use' }));

    // then
    expect(isViewed(selfParticipant.nickname)).toBe(true);
  });

  it('입장 실패 시 안내를 보여 준다', async () => {
    // given
    mockEnterRoom.mockRejectedValue(new Error('실패'));

    // when
    render(<CompactPomodoroWithSession layout="mobile" />);

    // then
    await waitFor(() => {
      expect(screen.getByTestId('enter-room-error')).toBeTruthy();
    });
  });

  it('SSE 연결이 실패하면 에러 상태를 표시한다', async () => {
    // given
    mockEnterRoom.mockResolvedValue({
      participant: selfParticipant,
      room: baseRoom,
    });
    mockUseRoomSSE.mockReturnValue({ status: 'error' });

    // when
    render(<CompactPomodoroWithSession layout="tablet" />);

    // then
    await waitFor(() => {
      expect(screen.getByTestId('sse-error')).toBeTruthy();
    });
  });
});
