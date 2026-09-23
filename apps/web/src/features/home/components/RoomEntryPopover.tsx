import { useState } from 'react';
import { EntryOptionButton } from './EntryOptionButton';

type Step = 'option' | 'input';

export function RoomEntryPopover() {
  const [step, setStep] = useState<Step>('option');

  return (
    <>
      {/* TODO: 추후 squiggle 라이브러리 배포 시 말풍선으로 교체 */}
      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col gap-3 rounded-2xl border-4 border-black bg-white px-4 py-3">
        {step === 'option' ? (
          <>
            <div className="text-2xl text-nowrap">어디서 공부할까요?</div>
            <EntryOptionButton onClick={() => {}}>
              새로운 방 만들기
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
              className="w-62 border-b-2 border-gray px-3 py-2 text-lg placeholder-gray outline-none"
            />
            <button className="w-full rounded-lg border-2 border-gray px-3 py-2 text-lg">
              입장하기
            </button>
          </>
        )}
      </div>
    </>
  );
}
