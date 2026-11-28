import { Registry } from 'prom-client';
import { MetricsService } from '../../../src/metrics/metrics.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { readMetricValue } from '../../metrics/read-metric-value';

const SSE_EMIT_DURATION = 'sse_emit_duration_seconds';

describe('SseService', () => {
  describe('emit', () => {
    it('방 이벤트를 보내면 나눠 주는 데 걸린 시간이 그 이벤트 종류로 한 번 기록된다', async () => {
      // given
      const registry = new Registry();
      const sseService = new SseService(new MetricsService(registry));
      const subscription = sseService.subscribe('room-1').subscribe();

      // when
      sseService.emit('room-1', { type: 'chat_message', data: {} });

      // then
      const readCount = (type: string) =>
        readMetricValue(
          registry,
          SSE_EMIT_DURATION,
          { type },
          `${SSE_EMIT_DURATION}_count`,
        );
      expect(await readCount('chat_message')).toBe(1);
      expect(await readCount('room_state')).toBe(0);
      subscription.unsubscribe();
    });
  });
});
