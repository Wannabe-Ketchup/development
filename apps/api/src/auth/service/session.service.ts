import { Injectable, Logger } from '@nestjs/common';
import { Session as ExpressSession, SessionData } from 'express-session';
import { randomUUID } from 'node:crypto';
import { Session } from '../domain/session';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  isValid(reqSession: ExpressSession & Partial<SessionData>, now: number): boolean {
    if (!reqSession.participantId) {
      return false;
    }
    const session = Session.from(reqSession as SessionData);
    return !session.isExpired(now);
  }

  issueSession(reqSession: ExpressSession & Partial<SessionData>, now: number): void {
    if (!this.isValid(reqSession, now)) {
      this.create(reqSession, now);
    }
  }

  updateLastAccessedAt(reqSession: ExpressSession & Partial<SessionData>, now: number): void {
    if (!reqSession.participantId) {
      return;
    }
    const session = Session.from(reqSession as SessionData);
    session.updateLastAccessedAt(now);
    Object.assign(reqSession, session);
  }

  private create(reqSession: ExpressSession & Partial<SessionData>, now: number): void {
    const participantId = randomUUID();
    const session = Session.create(participantId, now);

    Object.assign(reqSession, session);

    this.logger.log(
      `세션이 생성되었습니다. participantId=${session.participantId}, role=${session.role}, createdAt=${session.createdAt}, expiresAt=${session.expiresAt}`,
    );
  }
}
