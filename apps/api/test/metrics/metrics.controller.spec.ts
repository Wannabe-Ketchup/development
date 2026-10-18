import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import session from 'express-session';
import { MetricsModule } from '../../src/metrics/metrics.module';
import { SessionGuard } from '../../src/auth/guard/session.guard';
import { SessionService } from '../../src/auth/service/session.service';

const METRICS_PATH = '/metrics';
const PROMETHEUS_MEDIA_TYPE = /^text\/plain;/;
const PROMETHEUS_FORMAT_VERSION = /;\s*version=0\.0\.4(;|$)/;

const DASHBOARD_DEFAULT_METRICS = [
  'process_cpu_user_seconds_total',
  'process_cpu_system_seconds_total',
  'process_resident_memory_bytes',
  'nodejs_heap_size_used_bytes',
  'nodejs_eventloop_lag_seconds',
];

const createMetricsApp = async (): Promise<INestApplication<App>> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [MetricsModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  await app.init();
  return app;
};

describe('GET /metrics', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createMetricsApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('Prometheus가 수집할 수 있는 텍스트 형식으로 메트릭을 노출한다', async () => {
    // when
    const response = await request(app.getHttpServer()).get(METRICS_PATH);

    // then
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(PROMETHEUS_MEDIA_TYPE);
    expect(response.headers['content-type']).toMatch(PROMETHEUS_FORMAT_VERSION);
  });

  it('대시보드에 필요한 Node 프로세스 기본 메트릭이 포함된다', async () => {
    // when
    const response = await request(app.getHttpServer()).get(METRICS_PATH);

    // then
    for (const metricName of DASHBOARD_DEFAULT_METRICS) {
      expect(response.text).toContain(metricName);
    }
  });

  it('앱을 여러 번 띄워도 메트릭 등록이 충돌하지 않는다', async () => {
    // given
    const anotherApp = await createMetricsApp();

    try {
      // when
      const response = await request(anotherApp.getHttpServer()).get(
        METRICS_PATH,
      );

      // then
      expect(response.status).toBe(200);
    } finally {
      await anotherApp.close();
    }
  });
});

describe('GET /metrics (전역 세션 가드 활성화)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule],
      providers: [
        SessionService,
        { provide: APP_GUARD, useClass: SessionGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('세션 없이도 메트릭을 수집할 수 있다', async () => {
    // when
    const response = await request(app.getHttpServer()).get(METRICS_PATH);

    // then
    expect(response.status).toBe(200);
  });
});
