import { Session } from '../../../src/auth/domain/session';
import { Role } from '../../../src/auth/domain/role.enum';

describe('Session', () => {
  describe('create', () => {
    it('세션의 역할은 GUEST로 설정된다', () => {
      // given
      const participantId = 'participantId';
      const now = new Date(2026, 10, 1).getTime();
      const expectedRole = Role.GUEST;

      // when
      const session = Session.create(participantId, now);

      // then
      expect(session.role).toBe(expectedRole);
    });

    it('세션의 만료 시간은 생성 시점으로부터 지정된 유효기간만큼 지난 시점으로 설정된다', () => {
      // given
      const participantId = 'participantId';
      const now = new Date(2026, 10, 1).getTime();
      const expectedExpiresAt = now + Session.TTL_MS;

      // when
      const session = Session.create(participantId, now);

      // then
      expect(session.expiresAt).toBe(expectedExpiresAt);
    });
  });

  describe('isExpired', () => {
    it('현재 시간이 세션의 만료 시간을 넘었다면 세션이 만료된 것으로 간주한다', () => {
      // given
      const participantId = 'participantId';
      const now = new Date(2026, 10, 1).getTime();
      const session = Session.create(participantId, now);
      const expiredTime = now + Session.TTL_MS + 1; // 만료 시간 1ms 이후

      // when
      const result = session.isExpired(expiredTime);

      // then
      expect(result).toBe(true);
    });

    it('현재 시간이 세션의 만료 시간 이전이라면 세션이 유효한 것으로 간주한다', () => {
      // given
      const participantId = 'participantId';
      const now = new Date(2026, 10, 1).getTime();
      const session = Session.create(participantId, now);
      const validTime = now + Session.TTL_MS - 1; // 만료 시간 1ms 전

      // when
      const result = session.isExpired(validTime);

      // then
      expect(result).toBe(false);
    });
  });

  describe('updateLastAccessedAt', () => {
    it('세션에 접근할 때마다 마지막 접근 시간이 갱신된다', () => {
      // given
      const participantId = 'participantId';
      const now = new Date(2026, 10, 1).getTime();
      const session = Session.create(participantId, now);
      const updatedTime = now + 5000;

      // when
      session.updateLastAccessedAt(updatedTime);

      // then
      expect(session.lastAccessedAt).toBe(updatedTime);
    });
  });
});
