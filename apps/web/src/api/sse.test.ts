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

  private readonly listeners = new Map<string, (e: MessageEvent) => void>();

  addEventListener(type: string, listener: (e: MessageEvent) => void): void {
    this.listeners.set(type, listener);
  }

  close = vi.fn();

  receive(type: string, data: unknown): void {
    this.listeners.get(type)?.(
      new MessageEvent(type, { data: JSON.stringify(data) }),
    );
  }

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

  describe('조용히 끊긴 연결 감시', () => {
    const SILENT_CONNECTION_TIMEOUT_MS = 45_000;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('45초 동안 아무 이벤트도 받지 못하면 연결을 닫고 바로 다시 연결한다', () => {
      // given
      createRoomSseConnection('room-1', { onMessage: vi.fn() });
      FakeEventSource.instances[0].open();

      // when
      vi.advanceTimersByTime(SILENT_CONNECTION_TIMEOUT_MS);

      // then
      expect(FakeEventSource.instances[0].close).toHaveBeenCalledTimes(1);
      expect(FakeEventSource.instances).toHaveLength(2);
      expect(FakeEventSource.instances[1].url).toBe('/api/sse/pomodoro/room-1');
    });

    it('이벤트를 받으면 45초를 처음부터 다시 세어 연결을 유지한다', () => {
      // given
      createRoomSseConnection('room-1', { onMessage: vi.fn() });
      FakeEventSource.instances[0].open();
      vi.advanceTimersByTime(SILENT_CONNECTION_TIMEOUT_MS - 1);

      // when
      FakeEventSource.instances[0].receive('heartbeat', {});
      vi.advanceTimersByTime(SILENT_CONNECTION_TIMEOUT_MS - 1);

      // then
      expect(FakeEventSource.instances[0].close).not.toHaveBeenCalled();
      expect(FakeEventSource.instances).toHaveLength(1);
    });

    it('화면이 연결을 닫으면 45초가 지나도 다시 연결하지 않는다', () => {
      // given
      const connection = createRoomSseConnection('room-1', {
        onMessage: vi.fn(),
      });
      FakeEventSource.instances[0].open();

      // when
      connection.close();
      vi.advanceTimersByTime(SILENT_CONNECTION_TIMEOUT_MS);

      // then
      expect(FakeEventSource.instances).toHaveLength(1);
    });

    it('거절이 이어져 다시 연결하지 않기로 하면 45초가 지나도 다시 연결하지 않는다', async () => {
      // given
      mockLoginGuest.mockResolvedValue(undefined);
      createRoomSseConnection('room-1', { onMessage: vi.fn() });
      FakeEventSource.instances[0].rejectByServer();
      await vi.advanceTimersByTimeAsync(0);

      // when
      FakeEventSource.instances[1].rejectByServer();
      vi.advanceTimersByTime(SILENT_CONNECTION_TIMEOUT_MS);

      // then
      expect(FakeEventSource.instances).toHaveLength(2);
    });
  });
});
