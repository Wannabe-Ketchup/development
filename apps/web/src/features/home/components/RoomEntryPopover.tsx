import { useState } from 'react';
import { EntryOptionButton } from './EntryOptionButton';
import { createRoom } from '@/api/room';
import { cn } from '@/lib/cn';
import { goToRoom } from '@/lib/room-id';

type Step = 'option' | 'input';

export function RoomEntryPopover() {
  const [step, setStep] = useState<Step>('option');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const { roomId } = await createRoom();
      goToRoom(roomId);
    } catch {
      setError('방 생성에 실패했습니다.');
      setIsCreating(false);
    }
  };

  const handleEnterRoom = () => {
    const roomId = inviteCode.trim();

    if (!roomId) {
      setError('초대 링크(코드)를 입력해 주세요.');
      return;
    }

    goToRoom(roomId);
  };

  return (
    /* TODO: 추후 squiggle 라이브러리 배포 시 말풍선으로 교체 */
    <div
      className={cn(
        'absolute -top-3 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col gap-3 rounded-2xl border-4 bg-white px-4 py-3',
        error ? 'animate-shake border-error' : 'border-black',
      )}
    >
      {error && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full text-nowrap text-error">
          {error}
        </div>
      )}
      {step === 'option' ? (
        <>
          <div className="text-2xl text-nowrap">어디서 공부할까요?</div>
          <EntryOptionButton onClick={handleCreateRoom}>
            {isCreating ? '방 만드는 중...' : '새로운 방 만들기'}
          </EntryOptionButton>
          <EntryOptionButton
            onClick={() => {
              setStep('input');
            }}
          >
            초대받은 방 입장하기
          </EntryOptionButton>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="초대 링크(코드)를 입력하세요"
            value={inviteCode}
            onChange={(event) => {
              setInviteCode(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleEnterRoom();
            }}
            className="w-62 border-b-2 border-gray px-3 py-2 text-lg placeholder-gray outline-none"
          />
          <button
            onClick={handleEnterRoom}
            className="w-full rounded-lg border-2 border-gray px-3 py-2 text-lg"
          >
            입장하기
          </button>
        </>
      )}
    </div>
  );
}
