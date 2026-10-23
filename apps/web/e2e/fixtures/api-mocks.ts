import type { Page } from '@playwright/test';
import type { Room } from '@pomodoro/shared';

interface ParticipantSetup {
  id: string;
  nickname: string;
  statusMessage: string;
}

interface RoomWithSelfSetup {
  self: Omit<ParticipantSetup, 'id'>;
  others: Omit<ParticipantSetup, 'id'>[];
}

const DEFAULT_TIMER = {
  status: 'IDLE' as const,
  focusTimeSec: 1500,
  breakTimeSec: 300,
  totalCycle: 4,
  timerStartedAt: null,
  remainingTimeSec: 1500,
};

export async function mockCreateRoom(
  page: Page,
  options?: { roomId?: string; pending?: boolean },
) {
  await page.route('**/api/pomodoro/room', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    if (options?.pending) return; // never fulfill — keeps request pending
    await route.fulfill({ json: { roomId: options?.roomId ?? 'new-room-id' } });
  });
}

export async function mockExistsRoom(
  page: Page,
  options?: { exists?: boolean },
) {
  await page.route('**/api/pomodoro/room/*/exists', async (route) => {
    await route.fulfill({ json: { exists: options?.exists ?? true } });
  });
}

export async function mockRoomWith(page: Page, setup: RoomWithSelfSetup) {
  const SELF_ID = 'self-p1';

  const participants: Room['participants'] = [
    {
      id: SELF_ID,
      nickname: setup.self.nickname,
      statusMessage: setup.self.statusMessage,
      currentCycle: 1,
    },
    ...setup.others.map((o, i) => ({
      id: `other-p${i + 2}`,
      nickname: o.nickname,
      statusMessage: o.statusMessage,
      currentCycle: 1,
    })),
  ];

  const room: Room = {
    roomId: 'test-room',
    participants,
    timer: DEFAULT_TIMER,
    mode: 'IDLE',
    currentCycle: 1,
  };

  await page.route('**/api/pomodoro/room/*/participant', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      json: {
        participant: { id: SELF_ID, nickname: setup.self.nickname },
        room,
      },
    });
  });

  // SSE hangs so sseStatus stays 'connecting' — no error overlay
  await page.route('**/api/sse/pomodoro/**', async (_route) => {
    // Never fulfill: EventSource stays open without triggering onerror
  });
}

export async function mockEnterRoomOnly(page: Page) {
  const room: Room = {
    roomId: 'test-room',
    participants: [
      {
        id: 'self-p1',
        nickname: '토마토1',
        statusMessage: '',
        currentCycle: 1,
      },
    ],
    timer: DEFAULT_TIMER,
    mode: 'IDLE',
    currentCycle: 1,
  };

  await page.route('**/api/pomodoro/room/*/participant', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      json: { participant: { id: 'self-p1', nickname: '토마토1' }, room },
    });
  });

  await page.route('**/api/sse/pomodoro/**', async (_route) => {});
}
