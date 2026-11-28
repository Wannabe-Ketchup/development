import type { SessionData, Store } from 'express-session';
import { createSessionStore } from '../../../src/auth/config/session.config';

const PRUNE_INTERVAL_MS = 10 * 60 * 1000;

function readSession(
  store: Store,
  sessionId: string,
): Promise<SessionData | null | undefined> {
  return new Promise((resolve) => {
    store.get(sessionId, (_err, sess) => resolve(sess));
  });
}

describe('createSessionStore', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('만료된 세션은 다시 접속하지 않아도 정리 주기가 지나면 저장소에서 지워진다', async () => {
    // given
    // 저장소 콜백이 setImmediate로 불리므로 setImmediate는 실제 타이머로 둔다
    jest.useFakeTimers({
      now: new Date('2100-01-01T00:00:00Z'),
      doNotFake: ['setImmediate'],
    });
    const store = createSessionStore();
    const sessionId = 'expired-session';
    const expiresAt = new Date(Date.now() + 1_000);
    store.set(sessionId, {
      cookie: { originalMaxAge: 1_000, expires: expiresAt },
    } as SessionData);

    // when
    jest.advanceTimersByTime(PRUNE_INTERVAL_MS);
    // 실제 시각(2100년 이전)으로 돌아가 조회 자체는 만료로 지우지 않게 한다
    jest.useRealTimers();
    const sess = await readSession(store, sessionId);

    // then
    expect(sess).toBeUndefined();
  });

  it('아직 만료되지 않은 세션은 정리 주기가 지나도 저장소에 남는다', async () => {
    // given
    jest.useFakeTimers({
      now: new Date('2100-01-01T00:00:00Z'),
      doNotFake: ['setImmediate'],
    });
    const store = createSessionStore();
    const sessionId = 'active-session';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ONE_DAY_MS);
    store.set(sessionId, {
      cookie: { originalMaxAge: ONE_DAY_MS, expires: expiresAt },
    } as SessionData);

    // when
    jest.advanceTimersByTime(PRUNE_INTERVAL_MS);
    jest.useRealTimers();
    const sess = await readSession(store, sessionId);

    // then
    expect(sess).toBeDefined();
  });
});
