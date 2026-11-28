import type { INestApplication } from '@nestjs/common';
import session from 'express-session';
import { Session } from '../domain/session';

const EXPIRED_SESSION_PRUNE_INTERVAL_MS = 10 * 60 * 1000;

// 기본 MemoryStore는 만료된 세션을 그 세션으로 요청이 와야 지운다.
// 쿠키가 만료된 브라우저는 다시 오지 않으므로 all()(만료된 세션을 지우며 순회)을 주기적으로 부른다
export function createSessionStore(): session.MemoryStore {
  const store = new session.MemoryStore();
  setInterval(
    () => store.all(() => {}),
    EXPIRED_SESSION_PRUNE_INTERVAL_MS,
  ).unref();
  return store;
}

export interface SessionConfigProps {
  secret: string;
  isProduction: boolean;
}

// express-session 미들웨어를 앱에 등록하는 설정 객체다. DI로 만들지 않고 main.ts와 테스트에서 직접 쓴다.
export class SessionConfig {
  private constructor(private readonly props: SessionConfigProps) {}

  static of(props: SessionConfigProps): SessionConfig {
    return new SessionConfig(props);
  }

  apply(app: INestApplication): void {
    app.use(
      session({
        store: createSessionStore(),
        secret: this.props.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          // 프로덕션 환경이면 HTTPS에서만 쿠키 전송
          secure: this.props.isProduction,
          maxAge: Session.TTL_MS,
        },
      }),
    );
  }
}
