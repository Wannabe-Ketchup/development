import TomatoSurprisedSvg from '@/assets/tomato_surprised.svg?react';
import { useTomatoDrag } from './hooks/useTomatoDrag';
import { SofaSection } from './components/SofaSection';
import { GuideSection } from './components/GuideSection';
import { TableSection } from './components/TableSection';

function Home() {
  const { tomatoState, tableRef, handlers, cancel } = useTomatoDrag();

  return (
    <main className="flex h-dvh w-dvw items-center justify-center bg-[#FFFDF7]">
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
            left: tomatoState.pos.x - 52,
            top: tomatoState.pos.y + 10,
          }}
        >
          <TomatoSurprisedSvg className="animate-tomato-surprised-slide" />
        </div>
      )}
    </main>
  );
}

export default Home;
