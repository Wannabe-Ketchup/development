import { WobblyBox } from '@squiggle-line/react';
import { cn } from '@/lib/cn';

interface ParticipantDotsProps {
  total: number;
  // 지금 보는 참여자의 0부터 시작하는 순번
  index: number;
}

// 몇 번째 참여자를 보는지 손그림 알약 안의 점으로 보여 준다. 같은 내용을 캐러셀이 읽어 주므로 스크린 리더에서는 숨긴다
export function ParticipantDots({ total, index }: ParticipantDotsProps) {
  return (
    <div aria-hidden="true" data-testid="participant-dots">
      <WobblyBox
        borderRadius={999}
        strokeWidth={3}
        pathClassName="fill-cream stroke-black"
        frequency={500}
        wiggle={5}
        smoothen={12}
      >
        {/* relative여야 채우기가 점을 덮지 않는다 */}
        <div className="relative flex h-8.5 items-center gap-1.5 px-4">
          {Array.from({ length: total }, (_, dotIndex) => (
            <span
              key={dotIndex}
              className={cn(
                'rounded-full',
                dotIndex === index ? 'size-3 bg-black' : 'size-2.5 bg-gray',
              )}
            />
          ))}
        </div>
      </WobblyBox>
    </div>
  );
}
