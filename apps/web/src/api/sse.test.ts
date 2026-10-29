import type { Mock } from 'vitest';
import { createRoomSseConnection } from './sse';
import { loginGuest } from './auth';

vi.mock('./auth');

const mockLoginGuest = loginGuest as unknown as Mock;

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.OPEN;
  onopen: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;

  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener = vi.fn();
  close = vi.fn();

  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.onopen?.();
  }

  rejectByServer(): void {
    this.readyState = FakeEventSource.CLOSED;
    this.onerror?.(new Event('error'));
  }
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createRoomSseConnection', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('연결이 거절되어 닫히면 게스트 로그인 후 한 번 다시 연결한다', async () => {
    // given
    mockLoginGuest.mockResolvedValue(undefined);
    const onError = vi.fn();
    createRoomSseConnection('room-1', { onMessage: vi.fn(), onError });

    // when
    FakeEventSource.instances[0].rejectByServer();
    await flushPromises();

    // then
    expect(mockLoginGuest).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].url).toBe('/api/sse/pomodoro/room-1');
    expect(onError).not.toHaveBeenCalled();
  });

  it('다시 연결한 뒤에도 거절되면 onError를 호출하고 더 연결하지 않는다', async () => {
    // given
    mockLoginGuest.mockResolvedValue(undefined);
    const onError = vi.fn();
    createRoomSseConnection('room-1', { onMessage: vi.fn(), onError });
    FakeEventSource.instances[0].rejectByServer();
    await flushPromises();

    // when
    FakeEventSource.instances[1].rejectByServer();
    await flushPromises();

    // then
    expect(onError).toHaveBeenCalledTimes(1);
    expect(mockLoginGuest).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it('다시 연결되어 열린 뒤 또 거절되면 게스트 로그인을 한 번 더 하고 다시 연결한다', async () => {
    // given
    mockLoginGuest.mockResolvedValue(undefined);
    const onError = vi.fn();
    createRoomSseConnection('room-1', { onMessage: vi.fn(), onError });
    FakeEventSource.instances[0].rejectByServer();
    await flushPromises();
    FakeEventSource.instances[1].open();

    // when
    FakeEventSource.instances[1].rejectByServer();
    await flushPromises();

    // then
    expect(mockLoginGuest).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.instances).toHaveLength(3);
    expect(onError).not.toHaveBeenCalled();
  });
});
