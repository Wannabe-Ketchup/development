import type { MessageEvent } from '@nestjs/common';
import { NEVER, Subject, of, throwError } from 'rxjs';
import { Registry } from 'prom-client';
import { MetricsService } from '../../src/metrics/metrics.service';
import { readMetricValue } from './read-metric-value';

const SSE_CONNECTIONS = 'sse_connections_active';
const SSE_EVENTS_SENT = 'sse_events_sent_total';
const ROOM_STATE = 'room_state';
const DEFAULT_EVENT_TYPE = 'message';

const roomStateEvent: MessageEvent = { type: ROOM_STATE, data: {} };

describe('MetricsService.trackSseStream', () => {
  let registry: Registry;
  let metricsService: MetricsService;

  beforeEach(() => {
    registry = new Registry();
    metricsService = new MetricsService(registry);
  });

  it('클라이언트가 SSE에 연결하면 현재 연결 수가 늘어난다', async () => {
    // given
    const stream = metricsService.trackSseStream(NEVER);

    // when
    const subscription = stream.subscribe();

    // then
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(1);
    subscription.unsubscribe();
  });

  it('클라이언트 연결이 끊기면 현재 연결 수가 다시 줄어든다', async () => {
    // given
    const subscription = metricsService.trackSseStream(NEVER).subscribe();

    // when
    subscription.unsubscribe();

    // then
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(0);
  });

  it('스트림이 에러로 끝나도 현재 연결 수가 줄어든다', async () => {
    // given
    const failingSource = throwError(() => new Error('스트림 오류'));

    // when
    metricsService.trackSseStream(failingSource).subscribe({
      error: () => undefined,
    });

    // then
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(0);
  });

  it('스트림을 만들기만 하고 연결하지 않으면 연결 수는 변하지 않는다', async () => {
    // when
    metricsService.trackSseStream(NEVER);

    // then
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(0);
  });

  it('클라이언트에 전송한 이벤트는 이벤트 타입별로 집계된다', async () => {
    // given
    const sentEventCount = 2;
    const source = of(roomStateEvent, roomStateEvent);

    // when
    metricsService.trackSseStream(source).subscribe();

    // then
    expect(
      await readMetricValue(registry, SSE_EVENTS_SENT, { type: ROOM_STATE }),
    ).toBe(sentEventCount);
  });

  it('같은 이벤트를 여러 클라이언트가 받으면 받은 클라이언트 수만큼 집계된다', async () => {
    // given
    const roomEvents = new Subject<MessageEvent>();
    const clientCount = 2;
    const subscriptions = Array.from({ length: clientCount }, () =>
      metricsService.trackSseStream(roomEvents).subscribe(),
    );

    // when
    roomEvents.next(roomStateEvent);

    // then
    expect(
      await readMetricValue(registry, SSE_EVENTS_SENT, { type: ROOM_STATE }),
    ).toBe(clientCount);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  it('타입이 없는 이벤트는 message 타입으로 집계된다', async () => {
    // given
    const untypedEvent: MessageEvent = { data: {} };

    // when
    metricsService.trackSseStream(of(untypedEvent)).subscribe();

    // then
    expect(
      await readMetricValue(registry, SSE_EVENTS_SENT, {
        type: DEFAULT_EVENT_TYPE,
      }),
    ).toBe(1);
  });
});
