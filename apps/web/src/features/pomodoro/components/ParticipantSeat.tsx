import type { Participant } from '@pomodoro/shared';
import tomato from '@/assets/tomato.svg';
import { cn } from '@/lib/cn';

interface ParticipantSeatProps {
  participant: Participant;
  translateX: number;
  isPending: boolean;
}

export function ParticipantSeat({
  participant,
  translateX,
  isPending,
}: ParticipantSeatProps) {
  return (
    <div
      className="absolute bottom-0 left-1/2 flex flex-col items-center transition-transform duration-300 ease-out"
      style={{ transform: `translateX(calc(-50% + ${translateX}px))` }}
    >
      <span className="mb-1 rounded bg-white px-2 py-0.5 text-sm whitespace-nowrap">
        {participant.nickname}
      </span>

      <div className={cn('relative', isPending && 'opacity-40 grayscale')}>
        <img src={tomato} alt="참여자 캐릭터" className="w-28 max-w-none" />

        {isPending && (
          <div
            data-testid="self-seat-pending"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
