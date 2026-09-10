import { describe, it, expect } from 'vitest';
import { getRoomIdFromSearch } from './room-id';

describe('getRoomIdFromSearch', () => {
  it('쿼리 문자열에 roomId가 있으면 그 값을 반환한다', () => {
    expect(getRoomIdFromSearch('?roomId=abc')).toBe('abc');
  });

  it('쿼리 문자열에 roomId가 없으면 null을 반환한다', () => {
    expect(getRoomIdFromSearch('?other=1')).toBeNull();
  });

  it('다른 파라미터와 섞여 있어도 roomId만 정확히 추출한다', () => {
    expect(getRoomIdFromSearch('?other=1&roomId=abc&x=2')).toBe('abc');
  });
});
