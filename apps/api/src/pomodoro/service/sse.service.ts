import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { SseEventPayload } from '@pomodoro/shared';

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
        retry: msg.retry ?? 5000,
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
}
