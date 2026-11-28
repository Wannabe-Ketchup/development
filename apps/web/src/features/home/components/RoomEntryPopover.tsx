import { useRef, useState, type Ref } from 'react';
import { EntryOptionButton } from './EntryOptionButton';
import { PlacedSpeechBubble } from './PlacedSpeechBubble';
import type { HomeLayout } from '../lib/home-layout';
import { createRoom, EnterRoomError, enterRoomByInviteCode } from '@/api/room';
import { useShake } from '@/hooks/useShake';
import { cn } from '@/lib/cn';
import { goToRoom } from '@/lib/room-id';

type Step = 'option' | 'input';

const RETRY_MESSAGE = '잠시 후 다시 시도해 주세요.';

type PopoverSize = 'desktop' | 'medium' | 'mobile';

// 말풍선 글자·여백은 그림처럼 화면에 맞춰 줄인다. 폰에서도 누르는 칸은 높이 44 이상으로 둔다
const POPOVER_SIZE_STYLES: Record<
  PopoverSize,
  {
    paddingPx: number;
    strokeWidthPx: number;
    stack: string;
    // 방 고르기 두 버튼 사이
    optionGap: string;
    optionIcon: string;
    title: string;
    option: string;
    control: string;
    inputWidth: string;
  }
> = {
  desktop: {
    paddingPx: 12,
    strokeWidthPx: 4,
    stack: 'gap-3',
    optionGap: 'gap-3',
    optionIcon: 'size-4',
    title: 'mb-3 text-title',
    option: '',
    control: 'px-3 py-2 text-body',
    inputWidth: 'w-70',
  },
  medium: {
    paddingPx: 10,
    strokeWidthPx: 4,
    stack: 'gap-2.5',
    optionGap: 'gap-2.5',
    optionIcon: 'size-4',
    title: 'mb-2.5 text-title-sm',
    option: 'text-body-sm',
    control: 'px-3 py-2 text-body-sm',
    inputWidth: 'w-63',
  },
  mobile: {
    paddingPx: 8,
    strokeWidthPx: 3,
    stack: 'gap-1',
    // 버튼 높이 44를 지키므로 버튼 사이 간격만 없앤다
    optionGap: 'gap-0',
    optionIcon: 'size-3.5',
    title: 'mb-1 text-body-lg',
    option: 'py-2.5 text-body-sm',
    control: 'px-3 py-2.5 text-body-sm',
    inputWidth: 'w-60',
  },
};

function toPopoverSize(layout: HomeLayout): PopoverSize {
  switch (layout) {
    case 'desktop':
      return 'desktop';
    case 'medium':
      return 'medium';
    case 'portrait':
    case 'landscape':
      return 'mobile';
  }
}

// 초대코드 입장 실패를 사용자 안내 문구로 바꾼다
function toEntryErrorMessage(error: unknown): string {
  if (!(error instanceof EnterRoomError)) return RETRY_MESSAGE;
  switch (error.reason) {
    case 'not-found':
      return '찾을 수 없는 방입니다.';
    case 'rejected':
      return error.message;
    case 'unknown':
      return RETRY_MESSAGE;
  }
}

interface RoomEntryPopoverProps {
  // 가로 휴대폰은 토마토 왼쪽(꼬리 오른쪽), 그 밖에는 토마토 위(꼬리 아래). 바뀌어도 내용은 다시 마운트되지 않는다
  layout: HomeLayout;
  // 오류 문구를 포함한 말풍선 영역의 바깥 요소
  popoverRef?: Ref<HTMLDivElement>;
  onClose?: () => void;
}

export function RoomEntryPopover({
  layout,
  popoverRef,
  onClose,
}: RoomEntryPopoverProps) {
  const placement = layout === 'landscape' ? 'left' : 'top';
  const size = POPOVER_SIZE_STYLES[toPopoverSize(layout)];
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

    const trimmedInviteCode = inviteCode.trim();

    if (!trimmedInviteCode) {
      rejectEntry('초대 코드를 입력해 주세요.');
      return;
    }

    setIsPending(true);

    try {
      // 초대코드는 서버만 roomId로 풀 수 있으므로 입장 응답의 roomId로 이동한다
      const { room } = await enterRoomByInviteCode(trimmedInviteCode);
      goToRoom(room.roomId);
    } catch (error) {
      rejectEntry(toEntryErrorMessage(error));
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
      ref={popoverRef}
      className={cn(
        'absolute',
        placement === 'left'
          ? 'top-1/2 right-[calc(100%+var(--home-popover-gap,12px))] -translate-y-1/2'
          : 'top-[calc(var(--home-popover-gap,12px)*-1)] left-1/2 -translate-x-1/2 -translate-y-full',
      )}
      onKeyDown={(e) => {
        if (step === 'option' && e.key === 'Escape') {
          onClose?.();
        }
      }}
    >
      <div ref={ref} className="relative">
        <div
          id="room-entry-error"
          role="alert"
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap text-error"
        >
          {error ?? ''}
        </div>
        <PlacedSpeechBubble
          tail={placement === 'left' ? 'right' : 'bottom'}
          paddingPx={size.paddingPx}
          strokeWidthPx={size.strokeWidthPx}
          pathClassName={cn(
            'fill-white',
            error ? 'stroke-error' : 'stroke-black',
          )}
        >
          <div
            className={cn(
              'flex flex-col px-1',
              size.stack,
              step === 'input' && size.inputWidth,
            )}
          >
            {step === 'option' ? (
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- action buttons, not form controls
              <div role="group" aria-labelledby="room-entry-title">
                <div
                  id="room-entry-title"
                  className={cn('whitespace-nowrap', size.title)}
                >
                  어디서 공부할까요?
                </div>
                <div className={cn('flex flex-col', size.optionGap)}>
                  <EntryOptionButton
                    className={size.option}
                    iconClassName={size.optionIcon}
                    autoFocus
                    aria-disabled={isPending || undefined}
                    aria-busy={isPending || undefined}
                    onClick={handleCreateRoom}
                  >
                    {isPending ? '방 만드는 중...' : '새로운 방 만들기'}
                  </EntryOptionButton>
                  <EntryOptionButton
                    className={size.option}
                    iconClassName={size.optionIcon}
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
                    const input = event.currentTarget;
                    const value = input.value;
                    const uppercaseValue = value.replace(/[a-z]/g, (letter) =>
                      letter.toUpperCase(),
                    );

                    if (uppercaseValue !== value) {
                      const {
                        selectionStart,
                        selectionEnd,
                        selectionDirection,
                      } = input;
                      input.value = uppercaseValue;
                      input.setSelectionRange(
                        selectionStart,
                        selectionEnd,
                        selectionDirection ?? 'none',
                      );
                    }

                    setInviteCode(uppercaseValue);
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleEnterRoom();
                    if (event.key === 'Escape') onClose?.();
                  }}
                  className={cn(
                    'w-full border-b-2 border-gray placeholder-gray outline-none',
                    size.control,
                  )}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className={cn(
                      'rounded-lg border-2 border-gray whitespace-nowrap text-gray',
                      size.control,
                    )}
                  >
                    뒤로가기
                  </button>
                  <button
                    aria-disabled={isPending || undefined}
                    aria-busy={isPending || undefined}
                    onClick={handleEnterRoom}
                    className={cn(
                      'flex-1 rounded-lg border-2 border-black bg-black text-white',
                      size.control,
                    )}
                  >
                    입장하기
                  </button>
                </div>
              </>
            )}
          </div>
        </PlacedSpeechBubble>
      </div>
    </div>
  );
}
