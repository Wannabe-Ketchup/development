import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
  InternalServerErrorException,
  Param,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import request from 'supertest';
import { App } from 'supertest/types';
import { Registry } from 'prom-client';
import { MetricsModule } from '../../src/metrics/metrics.module';
import { PomodoroModule } from '../../src/pomodoro/pomodoro.module';
import { HealthModule } from '../../src/health/health.module';
import { readMetricValue } from './read-metric-value';

const HTTP_REQUESTS = 'http_requests_total';
const HTTP_DURATION = 'http_request_duration_seconds';
const HTTP_DURATION_COUNT = `${HTTP_DURATION}_count`;
const UNMATCHED_ROUTE = 'unmatched';

@Controller('test')
class MetricsTestController {
  @Get('rooms/:roomId')
  findRoom(@Param('roomId') roomId: string): { roomId: string } {
    return { roomId };
  }

  @Get('error')
  fail(): never {
    throw new InternalServerErrorException();
  }
}

describe('HTTP 요청 메트릭', () => {
  let app: INestApplication<App>;
  let registry: Registry;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        MetricsModule,
        PomodoroModule,
        HealthModule,
      ],
      controllers: [MetricsTestController],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>();
    await app.init();
    registry = app.get(Registry);
  });

  afterEach(async () => {
    await app.close();
  });

  it('HTTP 요청은 실제 URL이 아니라 라우트 패턴 단위로 집계된다', async () => {
    // given
    const roomId = 'room-abc123';

    // when
    await request(app.getHttpServer()).get(`/test/rooms/${roomId}`);

    // then
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, {
        method: 'GET',
        route: '/test/rooms/:roomId',
        status_code: 200,
      }),
    ).toBe(1);
    const exposed = await request(app.getHttpServer()).get('/metrics');
    expect(exposed.text).not.toContain(roomId);
  });

  it('응답시간은 같은 라우트 패턴 단위로 기록된다', async () => {
    // when
    await request(app.getHttpServer()).get('/test/rooms/room-1');

    // then
    expect(
      await readMetricValue(
        registry,
        HTTP_DURATION,
        { method: 'GET', route: '/test/rooms/:roomId', status_code: 200 },
        HTTP_DURATION_COUNT,
      ),
    ).toBe(1);
  });

  it('서버 에러 응답은 상태 코드별로 구분되어 집계된다', async () => {
    // when
    await request(app.getHttpServer()).get('/test/error');

    // then
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, {
        route: '/test/error',
        status_code: 500,
      }),
    ).toBe(1);
  });

  it('매칭되는 라우트가 없는 요청은 unmatched 하나로 묶인다', async () => {
    // given
    const scannerPaths = ['/wp-login.php', '/.env'];

    // when
    for (const path of scannerPaths) {
      await request(app.getHttpServer()).get(path);
    }

    // then
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, {
        route: UNMATCHED_ROUTE,
        status_code: 404,
      }),
    ).toBe(scannerPaths.length);
    const exposed = await request(app.getHttpServer()).get('/metrics');
    expect(exposed.text).not.toContain('wp-login');
  });

  it('헬스체크 요청은 응답시간 기준선으로 쓰기 위해 집계된다', async () => {
    // when
    await request(app.getHttpServer()).get('/health');

    // then
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, { route: '/health' }),
    ).toBe(1);
  });

  it('SSE 요청은 HTTP 메트릭에 집계되지 않는다', async () => {
    // given: 연결이 유지되는 정상 SSE는 끊길 때 finish가 발생하지 않으므로, 즉시 끝나는 404로 제외 규칙을 검증한다
    const unknownRoomId = 'no-such-room';

    // when
    const response = await request(app.getHttpServer()).get(
      `/sse/pomodoro/${unknownRoomId}?participantId=nobody`,
    );

    // then
    expect(response.status).toBe(404);
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, {
        route: '/sse/pomodoro/:roomId',
      }),
    ).toBe(0);
  });

  it('메트릭 수집 요청 자체는 HTTP 메트릭에 집계되지 않는다', async () => {
    // when
    await request(app.getHttpServer()).get('/metrics');
    await request(app.getHttpServer()).get('/metrics');

    // then
    expect(
      await readMetricValue(registry, HTTP_REQUESTS, { route: '/metrics' }),
    ).toBe(0);
  });
});
