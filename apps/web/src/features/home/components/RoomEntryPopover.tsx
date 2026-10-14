import { useState } from 'react';
import { WobblySpeechBubble } from '@squiggle-line/react';
import { EntryOptionButton } from './EntryOptionButton';
import { cn } from '@/lib/cn';

type Step = 'option' | 'input';

export function RoomEntryPopover() {
  const [step, setStep] = useState<Step>('option');

  return (
    <>
      <WobblySpeechBubble
        className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full"
        style={{ position: 'absolute' }}
        frequency={500}
        wiggle={3}
        smoothen={12}
        padding={12}
        borderRadius={16}
        strokeWidth={4}
        pathClassName="stroke-black fill-white"
        key={step}
      >
        <div
          className={cn('flex flex-col gap-3 px-1', step === 'input' && 'w-70')}
        >
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
                className="w-full border-b-2 border-gray px-3 py-2 text-lg placeholder-gray outline-none"
              />
              <button className="w-full rounded-lg border-2 border-gray px-3 py-2 text-lg">
                입장하기
              </button>
            </>
          )}
        </div>
      </WobblySpeechBubble>
    </>
  );
}
