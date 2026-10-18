import type { INestApplication } from '@nestjs/common';
import session from 'express-session';
import { Session } from '../domain/session';

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
