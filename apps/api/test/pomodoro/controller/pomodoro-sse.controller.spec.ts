import { NotFoundException, type MessageEvent } from '@nestjs/common';
import { NEVER, concat, of } from 'rxjs';
import { Registry } from 'prom-client';
import { PomodoroSseController } from '../../../src/pomodoro/controller/pomodoro-sse.controller';
import { RoomEventStreamService } from '../../../src/pomodoro/service/room-event-stream.service';
import { MetricsService } from '../../../src/metrics/metrics.service';
import { readMetricValue } from '../../metrics/read-metric-value';

const SSE_CONNECTIONS = 'sse_connections_active';
const SSE_EVENTS_SENT = 'sse_events_sent_total';
const ROOM_STATE = 'room_state';

describe('PomodoroSseController.streamEvents', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';
  const snapshotEvent: MessageEvent = { type: ROOM_STATE, data: {} };

  let registry: Registry;
  let streamEvents: jest.Mock;
  let controller: PomodoroSseController;

  beforeEach(() => {
    registry = new Registry();
    streamEvents = jest.fn();
    const roomEventStreamService = {
      streamEvents,
    } as unknown as RoomEventStreamService;

    controller = new PomodoroSseController(
      roomEventStreamService,
      new MetricsService(registry),
    );
  });

  it('참가자가 방 이벤트 스트림에 연결하면 SSE 연결 수와 전송 수에 반영된다', async () => {
    // given
    streamEvents.mockReturnValue(concat(of(snapshotEvent), NEVER));

    // when
    const subscription = controller
      .streamEvents(roomId, participantId)
      .subscribe();

    // then
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(1);
    expect(
      await readMetricValue(registry, SSE_EVENTS_SENT, { type: ROOM_STATE }),
    ).toBe(1);
    subscription.unsubscribe();
  });

  it('연결할 수 없는 참가자의 요청은 SSE 연결 수에 반영되지 않는다', async () => {
    // given
    streamEvents.mockImplementation(() => {
      throw new NotFoundException('참가자를 찾을 수 없습니다.');
    });

    // when & then
    expect(() => controller.streamEvents(roomId, participantId)).toThrow(
      NotFoundException,
    );
    expect(await readMetricValue(registry, SSE_CONNECTIONS)).toBe(0);
  });
});
