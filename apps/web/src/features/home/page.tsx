import TomatoSurprisedSvg from '@/assets/tomato_surprised.svg?react';
import { useStageScale } from '@/hooks/useStageScale';
import { useTomatoDrag } from './hooks/useTomatoDrag';
import { SofaSection } from './components/SofaSection';
import { GuideSection } from './components/GuideSection';
import { TableSection } from './components/TableSection';

function Home() {
  const { tomatoState, tableRef, handlers, cancel } = useTomatoDrag();
  // 스테이지가 축소돼 있으면 clientX는 화면 px이라 배율로 나눠 스테이지 px로 바꾼다.
  const scale = useStageScale();

  return (
    <main className="flex h-full w-full items-center justify-center bg-[#FFFDF7]">
      <div className="flex items-center gap-20">
        <SofaSection tomatoStatus={tomatoState.status} handlers={handlers} />
        <GuideSection tomatoStatus={tomatoState.status} />
        <TableSection
          tomatoStatus={tomatoState.status}
          ref={tableRef}
          onCancel={cancel}
        />
      </div>

      {tomatoState.status === 'dragging' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 h-28.75 w-31.25 overflow-hidden"
          style={{
            left: tomatoState.pos.x / scale - 52,
            top: tomatoState.pos.y / scale + 10,
          }}
        >
          <TomatoSurprisedSvg className="animate-tomato-surprised-slide" />
        </div>
      )}
    </main>
  );
}

export default Home;
