import TomatoSurprised from '@/assets/tomato_surprised.svg?react';
import { useTomatoDrag } from './hooks/useTomatoDrag';
import { SofaSection } from './components/SofaSection';
import { GuideSection } from './components/GuideSection';
import { TableSection } from './components/TableSection';

function Home() {
  const { tomatoState, tableRef, handlers } = useTomatoDrag();

  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-[#FFFDF7]">
      <div className="flex items-center gap-20">
        <SofaSection tomatoStatus={tomatoState.status} handlers={handlers} />
        <GuideSection tomatoStatus={tomatoState.status} />
        <TableSection tomatoStatus={tomatoState.status} ref={tableRef} />
      </div>

      {tomatoState.status === 'dragging' && (
        <div
          className="pointer-events-none fixed z-50 h-28.75 w-31.25 overflow-hidden"
          style={{
            left: tomatoState.pos.x - 52,
            top: tomatoState.pos.y + 10,
          }}
        >
          <TomatoSurprised className="animate-tomato-surprised-slide" />
        </div>
      )}
    </div>
  );
}

export default Home;
