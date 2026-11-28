import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('글자 크기 토큰과 글자색을 함께 쓰면 둘 다 남는다', () => {
    expect(cn('text-title', 'text-gray')).toBe('text-title text-gray');
  });

  it('글자 크기 토큰끼리는 나중 것만 남는다', () => {
    expect(cn('text-title', 'text-caption')).toBe('text-caption');
  });

  it('글자 크기 토큰이 앞의 줄 간격 클래스를 지우지 않는다', () => {
    expect(cn('leading-[1.15]', 'text-timer-mobile')).toBe(
      'leading-[1.15] text-timer-mobile',
    );
  });
});
