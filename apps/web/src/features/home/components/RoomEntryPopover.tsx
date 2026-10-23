import { useRef, useState } from 'react';
import { WobblySpeechBubble } from '@squiggle-line/react';
import { EntryOptionButton } from './EntryOptionButton';
import { createRoom, existsRoom } from '@/api/room';
import { useShake } from '@/hooks/useShake';
import { cn } from '@/lib/cn';
import { goToRoom } from '@/lib/room-id';

type Step = 'option' | 'input';

interface RoomEntryPopoverProps {
  onClose?: () => void;
}

export function RoomEntryPopover({ onClose }: RoomEntryPopoverProps) {
  const [step, setStep] = useState<Step>('option');
  const [inviteCode, setInviteCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ref, shake } = useShake<HTMLDivElement>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateRoom = async () => {
    if (isPending) return;

    setIsPending(true);
    setError(null);

    try {
      const { roomId } = await createRoom();
      goToRoom(roomId);
    } catch {
      setError('방 생성에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const rejectEntry = (message: string) => {
    setError(message);
    shake();
    inputRef.current?.focus();
  };

  const handleEnterRoom = async () => {
    if (isPending) return;

    const roomId = inviteCode.trim();

    if (!roomId) {
      rejectEntry('초대 코드를 입력해 주세요.');
      return;
    }

    setIsPending(true);

    try {
      const { exists } = await existsRoom(roomId);

      if (!exists) {
        rejectEntry('찾을 수 없는 방입니다.');
        return;
      }

      goToRoom(roomId);
    } catch {
      rejectEntry('잠시 후 다시 시도해 주세요.');
    } finally {
      setIsPending(false);
    }
  };

  const handleBack = () => {
    if (isPending) return;

    setStep('option');
    setError(null);
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- intentional event delegation for Escape key
    <div
      ref={ref}
      className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full"
      onKeyDown={(e) => {
        if (step === 'option' && e.key === 'Escape') {
          onClose?.();
        }
      }}
    >
      <div
        id="room-entry-error"
        role="alert"
        className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full text-nowrap text-error"
      >
        {error ?? ''}
      </div>
      <WobblySpeechBubble
        frequency={500}
        wiggle={3}
        smoothen={12}
        padding={12}
        borderRadius={16}
        strokeWidth={4}
        pathClassName={cn(
          'fill-white',
          error ? 'stroke-error' : 'stroke-black',
        )}
        key={step}
      >
        <div
          className={cn('flex flex-col gap-3 px-1', step === 'input' && 'w-70')}
        >
          {step === 'option' ? (
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- action buttons, not form controls
            <div role="group" aria-labelledby="room-entry-title">
              <div id="room-entry-title" className="mb-3 text-2xl text-nowrap">
                어디서 공부할까요?
              </div>
              <div className="flex flex-col gap-3">
                <EntryOptionButton
                  autoFocus
                  aria-disabled={isPending || undefined}
                  aria-busy={isPending || undefined}
                  onClick={handleCreateRoom}
                >
                  {isPending ? '방 만드는 중...' : '새로운 방 만들기'}
                </EntryOptionButton>
                <EntryOptionButton
                  aria-disabled={isPending || undefined}
                  aria-busy={isPending || undefined}
                  onClick={() => {
                    setStep('input');
                  }}
                >
                  초대받은 방 입장하기
                </EntryOptionButton>
              </div>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                autoFocus
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'room-entry-error' : undefined}
                placeholder="초대 코드를 입력하세요"
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleEnterRoom();
                  if (event.key === 'Escape') onClose?.();
                }}
                className="w-full border-b-2 border-gray px-3 py-2 text-lg placeholder-gray outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border-2 border-gray px-3 py-2 text-lg text-nowrap text-gray"
                >
                  뒤로가기
                </button>
                <button
                  aria-disabled={isPending || undefined}
                  aria-busy={isPending || undefined}
                  onClick={handleEnterRoom}
                  className="flex-1 rounded-lg border-2 border-black bg-black px-3 py-2 text-lg text-white"
                >
                  입장하기
                </button>
              </div>
            </>
          )}
        </div>
      </WobblySpeechBubble>
    </div>
  );
}
