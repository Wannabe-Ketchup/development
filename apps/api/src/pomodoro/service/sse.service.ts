import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SSE_HEARTBEAT_INTERVAL_MS } from '@pomodoro/shared';
import type { SseEventPayload } from '@pomodoro/shared';

export const SSE_RETRY_MS = 5000;

interface SseMessage {
  roomId: string;
  event: SseEventPayload;
  id: string;
  retry?: number;
}

@Injectable()
export class SseService {
  private readonly subject = new Subject<SseMessage>();
  private eventIdCounter = 0;

  subscribe(roomId: string): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      filter((msg) => msg.roomId === roomId),
      map((msg) => ({
        type: msg.event.type,
        data: msg.event.data,
        id: msg.id,
        retry: msg.retry ?? SSE_RETRY_MS,
      })),
    );
  }

  emit(
    roomId: string,
    event: SseEventPayload,
    options?: { retry?: number },
  ): void {
    const id = String(++this.eventIdCounter);
    this.subject.next({ roomId, event, id, retry: options?.retry });
  }

  // 연결마다 따로 만든다. subject로 보내면 방마다 보낼 때마다 모든 연결이 filter를 돈다
  // 브라우저는 받았다는 사실만 쓰므로 retry는 붙이지 않는다
  // id는 비워도 Nest가 연결마다 번호를 채운다. 지금은 Last-Event-ID를 읽는 곳이 없어 상관없다
  heartbeats(): Observable<MessageEvent> {
    const heartbeat = {
      type: 'heartbeat',
      data: {},
    } satisfies SseEventPayload;
    return interval(SSE_HEARTBEAT_INTERVAL_MS).pipe(map(() => heartbeat));
  }

  createOwnSnapshotEvent(event: SseEventPayload): MessageEvent {
    const id = String(++this.eventIdCounter);
    return { type: event.type, data: event.data, id, retry: SSE_RETRY_MS };
  }
}
