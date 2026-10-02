import { SessionData } from 'express-session';
import { Role } from './role.enum';

export class Session {
  static readonly TTL_MS = 24 * 60 * 60 * 1000;

  private constructor(
    public readonly participantId: string,
    public readonly role: Role,
    public readonly createdAt: number,
    public lastAccessedAt: number,
    public readonly expiresAt: number,
  ) {}

  static create(participantId: string, now: number): Session {
    const expiresAt = now + Session.TTL_MS;
    return new Session(participantId, Role.GUEST, now, now, expiresAt);
  }

  static from(data: SessionData): Session {
    return new Session(
      data.participantId,
      data.role,
      data.createdAt,
      data.lastAccessedAt,
      data.expiresAt,
    );
  }

  updateLastAccessedAt(now: number): void {
    this.lastAccessedAt = now;
  }

  isExpired(now: number): boolean {
    return now >= this.expiresAt;
  }
}
