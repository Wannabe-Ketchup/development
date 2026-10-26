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

/**
 * 입장 API + SSE room_state 이벤트를 즉시 전송해 isConfirmed=true 상태를 만든다.
 * canShowTour 조건(SSE 연결 완료)을 충족시켜 How to use 버튼이 렌더되도록 한다.
 *
 * route.fulfill()로 SSE body를 전송하면 연결이 즉시 닫히고, EventSource는
 * onerror 발화 후 재연결을 시도한다. sseStatus가 'error'가 되어 버튼이 숨겨지는
 * 문제를 막으려면 브라우저 수준에서 EventSource를 교체해야 한다.
 * addInitScript로 페이지 로드 전에 fake EventSource를 주입해, SSE URL에 대해
 * 연결을 유지하면서 room_state 이벤트를 즉시 발화하고 onerror를 발화하지 않는다.
 */
export async function mockRoomWithSSEConnected(page: Page) {
  const SELF_ID = 'self-p1';

  const room: Room = {
    roomId: 'test-room',
    participants: [
      {
        id: SELF_ID,
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
      json: { participant: { id: SELF_ID, nickname: '토마토1' }, room },
    });
  });

  // SSE URL(/api/sse/pomodoro/*)에 대해 fake EventSource를 주입한다.
  // fake EventSource는 연결을 닫지 않고(onerror 미발화), onopen + room_state 이벤트를 즉시 발화한다.
  // 이렇게 해야 isConfirmed=true, sseStatus!='error' 상태가 유지되어
  // canShowTour 조건을 충족한다.
  const roomJson = JSON.stringify(room);
  await page.addInitScript((roomData: string) => {
    const OriginalEventSource = window.EventSource;
    const SSE_PATTERN = /\/api\/sse\/pomodoro\//;

    // SSE 에러 트리거 함수 목록 (window.__triggerSSEError()로 호출)
    const errorTriggers: Array<() => void> = [];
    (window as unknown as Record<string, unknown>).__triggerSSEError = () => {
      errorTriggers.forEach((fn) => fn());
    };

    class FakeSSEEventSource extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSED = 2;
      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSED = 2;
      readyState: number = FakeSSEEventSource.OPEN;
      url: string;
      withCredentials = false;
      onopen: ((e: Event) => void) | null = null;
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;

      constructor(url: string) {
        super();
        this.url = url;
        // 즉시 open → room_state 이벤트 순서로 발화한다
        setTimeout(() => {
          const openEvent = new Event('open');
          if (this.onopen) this.onopen(openEvent);
          this.dispatchEvent(openEvent);

          const msgEvent = new MessageEvent('room_state', {
            data: roomData,
          });
          this.dispatchEvent(msgEvent);
        }, 0);

        // 에러 트리거 등록: __triggerSSEError() 호출 시 onerror 발화
        const triggerError = () => {
          this.readyState = FakeSSEEventSource.CLOSED;
          const errorEvent = new Event('error');
          if (this.onerror) this.onerror(errorEvent);
          this.dispatchEvent(errorEvent);
        };
        errorTriggers.push(triggerError);
      }

      close() {
        this.readyState = FakeSSEEventSource.CLOSED;
      }
    }

    // SSE URL에 해당하는 경우에만 fake로 교체한다
    window.EventSource = class SmartEventSource {
      private inner: EventSource | FakeSSEEventSource;

      constructor(url: string, init?: EventSourceInit) {
        if (SSE_PATTERN.test(url)) {
          this.inner = new FakeSSEEventSource(url);
        } else {
          this.inner = new OriginalEventSource(url, init);
        }
        return this.inner as unknown as SmartEventSource;
      }
    } as unknown as typeof EventSource;
  }, roomJson);

  // SSE 네트워크 요청은 hanging으로 두어 실제 요청이 가지 않도록 한다
  // (addInitScript가 EventSource를 가로채므로 실제로는 요청 자체가 발생하지 않을 수 있음)
  await page.route('**/api/sse/pomodoro/**', async (_route) => {
    // hanging — never fulfill
  });
}

/**
 * 입장 API는 성공시키고 SSE를 즉시 abort해 sseStatus='error' 상태로 만든다.
 * How to use 버튼이 사라지고 sse-error 오버레이가 노출되어야 한다.
 */
export async function mockSSEError(page: Page) {
  const SELF_ID = 'self-p1';

  const room: Room = {
    roomId: 'test-room',
    participants: [
      {
        id: SELF_ID,
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
      json: { participant: { id: SELF_ID, nickname: '토마토1' }, room },
    });
  });

  await page.route('**/api/sse/pomodoro/**', async (route) => {
    await route.abort('failed');
  });
}
