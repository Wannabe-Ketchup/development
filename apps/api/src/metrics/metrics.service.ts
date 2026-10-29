import { Injectable, type MessageEvent } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { Observable, defer, finalize, tap } from 'rxjs';

type HttpLabelName = 'method' | 'route' | 'status_code';

const HTTP_LABEL_NAMES: readonly HttpLabelName[] = [
  'method',
  'route',
  'status_code',
];

const HTTP_DURATION_BUCKETS_SECONDS = [
  0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5,
];

export const UNMATCHED_ROUTE = 'unmatched';

const DEFAULT_SSE_EVENT_TYPE = 'message';

export interface HttpRequestLabels {
  method: string;
  route: string | undefined;
  statusCode: number;
}

@Injectable()
export class MetricsService {
  private readonly httpRequests: Counter<HttpLabelName>;
  private readonly httpRequestDuration: Histogram<HttpLabelName>;
  private readonly sseConnections: Gauge;
  private readonly sseEventsSent: Counter<'type'>;

  constructor(registry: Registry) {
    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: HTTP_LABEL_NAMES,
      registers: [registry],
    });
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: HTTP_LABEL_NAMES,
      buckets: HTTP_DURATION_BUCKETS_SECONDS,
      registers: [registry],
    });
    this.sseConnections = new Gauge({
      name: 'sse_connections_active',
      help: 'Number of currently connected SSE clients',
      registers: [registry],
    });
    this.sseEventsSent = new Counter({
      name: 'sse_events_sent_total',
      help: 'Total number of SSE events sent to clients',
      labelNames: ['type'],
      registers: [registry],
    });
  }

  recordHttpRequest(
    { method, route, statusCode }: HttpRequestLabels,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route: route ?? UNMATCHED_ROUTE,
      status_code: statusCode,
    };
    this.httpRequests.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  /**
   * 클라이언트 한 명의 SSE 스트림을 감싸 연결 수와 전송 이벤트 수를 기록한다.
   * 구독 시점에 연결 수를 올리고, 연결 종료·에러·완료 시 내린다.
   */
  trackSseStream<T extends MessageEvent>(source: Observable<T>): Observable<T> {
    return defer(() => {
      this.sseConnections.inc();
      return source.pipe(
        tap((event) =>
          this.sseEventsSent.inc({
            type: event.type ?? DEFAULT_SSE_EVENT_TYPE,
          }),
        ),
        finalize(() => this.sseConnections.dec()),
      );
    });
  }
}
