import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../../../src/auth/service/session.service';
import { Session as ExpressSession, SessionData } from 'express-session';
import { Session } from '../../../src/auth/domain/session';
import { Role } from '../../../src/auth/domain/role.enum';

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
  });

  describe('isValid', () => {
    it('빈 세션은 유효하지 않다', () => {
      // given
      const now = new Date(2026, 10, 1).getTime();
      const reqSession = {} as ExpressSession & Partial<SessionData>;

      // when
      const result = sessionService.isValid(reqSession, now);

      // then
      expect(result).toBe(false);
    });

    it('유효기간이 지나 만료된 세션은 유효하지 않다', () => {
      // given
      const sessionCreatedAt = new Date(2026, 10, 1).getTime();
      const participantId = 'participantId';
      const expiresAt = sessionCreatedAt + Session.TTL_MS;
      const expiredTime = expiresAt + 1; // 만료 시간 1ms 뒤

      const reqSession = {
        participantId: participantId,
        role: Role.GUEST,
        createdAt: sessionCreatedAt,
        lastAccessedAt: sessionCreatedAt,
        expiresAt: expiresAt,
      } as ExpressSession & Partial<SessionData>;

      // when
      const result = sessionService.isValid(reqSession, expiredTime);

      // then
      expect(result).toBe(false);
    });

    it('참여자 ID가 존재하고 만료되지 않은 세션은 유효하다', () => {
      // given
      const now = new Date(2026, 10, 1).getTime();
      const participantId = 'participantId';

      const reqSession = {
        participantId: participantId,
        role: Role.GUEST,
        createdAt: now,
        lastAccessedAt: now,
        expiresAt: now + Session.TTL_MS,
      } as ExpressSession & Partial<SessionData>;

      // when
      const result = sessionService.isValid(reqSession, now);

      // then
      expect(result).toBe(true);
    });
  });

  describe('issueSession', () => {
    it('빈 세션으로 접근 시 새로운 세션을 발급한다', () => {
      // given
      const now = new Date(2026, 10, 1).getTime();
      const reqSession = {} as ExpressSession & Partial<SessionData>;
      const expectedRole = Role.GUEST;

      // when
      sessionService.issueSession(reqSession, now);

      // then
      expect(reqSession.participantId).toBeDefined();
      expect(reqSession.role).toBe(expectedRole);
      expect(reqSession.createdAt).toBeDefined();
      expect(reqSession.lastAccessedAt).toBeDefined();
      expect(reqSession.expiresAt).toBeDefined();
    });

    it('만료된 세션으로 접근 시 새로운 세션을 발급한다', () => {
      // given
      const sessionCreatedAt = new Date(2026, 10, 1).getTime();
      const participantId = 'participantId';
      const expiresAt = sessionCreatedAt + Session.TTL_MS;
      const expiredTime = expiresAt + 1000; // 만료 후 1초 뒤

      const reqSession = {
        participantId: participantId,
        role: Role.GUEST,
        createdAt: sessionCreatedAt,
        lastAccessedAt: sessionCreatedAt,
        expiresAt: expiresAt,
      } as ExpressSession & Partial<SessionData>;

      // when
      sessionService.issueSession(reqSession, expiredTime);

      // then
      expect(reqSession.participantId).not.toBe(participantId);
    });

    it('이미 유효한 세션을 가진 사용자는 기존 세션을 그대로 유지한다', () => {
      // given
      const sessionCreatedAt = new Date(2026, 10, 1).getTime();
      const expectedParticipantId = 'existing-id-123';
      const expectedRole = Role.GUEST;
      const validTime = sessionCreatedAt; // 세션 발급 직후 체크

      const reqSession = {
        participantId: expectedParticipantId,
        role: expectedRole,
        createdAt: sessionCreatedAt,
        lastAccessedAt: sessionCreatedAt,
        expiresAt: sessionCreatedAt + Session.TTL_MS,
      } as ExpressSession & Partial<SessionData>;

      // when
      sessionService.issueSession(reqSession, validTime);

      // then
      expect(reqSession.participantId).toBe(expectedParticipantId);
    });
  });

  describe('updateLastAccessedAt', () => {
    it('정상적으로 인증된 사용자의 요청이 올 때마다 세션의 마지막 접근 시간을 갱신한다', () => {
      // given
      const sessionCreatedAt = new Date(2026, 10, 1).getTime();
      const requestTime = new Date(2026, 10, 1, 1).getTime(); // 세션 발급 1시간 후

      const reqSession = {
        participantId: 'participantId',
        lastAccessedAt: sessionCreatedAt,
      } as ExpressSession & Partial<SessionData>;

      // when
      sessionService.updateLastAccessedAt(reqSession, requestTime);

      // then
      expect(reqSession.lastAccessedAt).toBe(requestTime);
    });
  });
});
