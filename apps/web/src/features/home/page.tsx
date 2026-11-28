import { useRef, type CSSProperties } from 'react';
import TomatoSurprisedSvg from '@/assets/tomato_surprised.svg?react';
import { PrivacyPolicyLink } from '@/components/PrivacyPolicyLink';
import { cn } from '@/lib/cn';
import { useHomeLayout } from './hooks/useHomeLayout';
import { useSceneOffset } from './hooks/useSceneOffset';
import { useTomatoDrag } from './hooks/useTomatoDrag';
import { HOME_LAYOUT_METRICS, toScaledPx } from './lib/home-layout';
import { HOME_ARTWORK_PX } from './lib/home-artwork';
import { SofaSection } from './components/SofaSection';
import { GuideSection } from './components/GuideSection';
import { TableSection } from './components/TableSection';
import { IntroBookButton } from './components/IntroBookButton';

const SURPRISED_TOMATO_PX = HOME_ARTWORK_PX.surprisedTomato;

function Home() {
  const layout = useHomeLayout();
  const metrics = HOME_LAYOUT_METRICS[layout];
  const { tomatoState, tableRef, handlers, cancel } = useTomatoDrag(layout);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  useSceneOffset({
    layout,
    isPopoverOpen: tomatoState.status === 'studying',
    sceneRef,
    rowRef,
    popoverRef,
  });

  return (
    <main
      data-layout={layout}
      style={
        {
          '--home-k': metrics.illustrationScale,
          '--home-gap': `${metrics.gapPx}px`,
          '--home-guide-gap': `${metrics.guideGapPx}px`,
          '--home-drop': `${metrics.dropInsetPx}px`,
          '--home-popover-gap': `${metrics.popoverGapPx}px`,
        } as CSSProperties
      }
      className="fixed inset-0 overflow-hidden overscroll-none bg-[#FFFDF7] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
    >
      <div
        ref={sceneRef}
        className="flex size-full items-center justify-center"
      >
        {/* 소파 → 안내 → 테이블 순서는 레이아웃과 상관없이 같다. 다시 마운트되지 않고 클래스만 바뀐다 */}
        <div
          ref={rowRef}
          className={cn(
            'flex items-center gap-(--home-gap)',
            layout === 'portrait' && 'flex-col',
          )}
        >
          <SofaSection tomatoStatus={tomatoState.status} handlers={handlers} />
          <GuideSection tomatoStatus={tomatoState.status} layout={layout} />
          <TableSection
            tomatoStatus={tomatoState.status}
            layout={layout}
            popoverRef={popoverRef}
            ref={tableRef}
            onCancel={cancel}
          />
        </div>
      </div>

      <IntroBookButton onOpen={cancel} />

      {/* 데스크톱·중간은 사용 설명서 버튼과 마주 보는 왼쪽 아래, 휴대폰 크기는 소파·테이블을 피해 안전 영역 안 아래 가운데에 둔다 */}
      <PrivacyPolicyLink
        className={cn(
          'absolute z-20 text-caption text-black/70',
          layout === 'desktop' || layout === 'medium'
            ? 'bottom-10 left-11'
            : 'bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 -translate-x-1/2',
        )}
      />

      {tomatoState.status === 'dragging' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 overflow-hidden"
          style={{
            width: toScaledPx(SURPRISED_TOMATO_PX.frameWidth),
            height: toScaledPx(SURPRISED_TOMATO_PX.height),
            left: `calc(${tomatoState.pos.x}px - ${toScaledPx(SURPRISED_TOMATO_PX.left)})`,
            top: `calc(${tomatoState.pos.y}px + ${toScaledPx(SURPRISED_TOMATO_PX.top)})`,
          }}
        >
          <TomatoSurprisedSvg
            className="animate-tomato-surprised-slide"
            style={{
              width: toScaledPx(SURPRISED_TOMATO_PX.spriteWidth),
              height: toScaledPx(SURPRISED_TOMATO_PX.height),
            }}
          />
        </div>
      )}
    </main>
  );
}

export default Home;
