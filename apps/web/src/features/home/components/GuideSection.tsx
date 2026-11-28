import { cn } from '@/lib/cn';
import ArrowSvg from '@/assets/arrow.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { toScaledPx, type HomeLayout } from '../lib/home-layout';
import { HOME_ARTWORK_PX } from '../lib/home-artwork';

const ARROW_WIDTH_PX = HOME_ARTWORK_PX.arrow.width;
const ARROW_HEIGHT_PX = HOME_ARTWORK_PX.arrow.height;
// 세로 배치에서는 문구 오른쪽에 아래를 향한 작은 화살표를 둔다(기존 그림을 90° 돌려 쓴다).
// 그림 배율(0.8)로 돌리면 높이 160이라 문구보다 훨씬 길어져, 문구 높이에 어울리게 0.42배(높이 84)로 둔다
const DOWN_ARROW_SCALE = 0.42;
const PORTRAIT_ARROW_GAP_PX = 10;

interface GuideSectionProps {
  tomatoStatus: TomatoState['status'];
  layout: HomeLayout;
}

export function GuideSection({ tomatoStatus, layout }: GuideSectionProps) {
  const isPortrait = layout === 'portrait';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center',
        isPortrait ? 'flex-row' : 'flex-col gap-(--home-guide-gap)',
        tomatoStatus === 'sleeping' ? 'visible' : 'invisible',
      )}
      style={
        isPortrait
          ? {
              gap: PORTRAIT_ARROW_GAP_PX,
              // 테이블 위에는 공부하는 토마토 자리(paddingTop)가 비어 있다. 같은 만큼 위를 띄워 소파와 테이블 사이 가운데에 놓는다
              marginTop: toScaledPx(HOME_ARTWORK_PX.table.paddingTop),
            }
          : undefined
      }
    >
      <div
        className={cn(
          'whitespace-nowrap',
          layout === 'desktop' ? 'text-headline' : 'text-title',
        )}
      >
        move the tomato!
      </div>
      {/* 같은 그림을 돌려 쓰므로 틀 크기만 바꾼다 */}
      <div
        className="relative"
        style={
          isPortrait
            ? {
                width: ARROW_HEIGHT_PX * DOWN_ARROW_SCALE,
                height: ARROW_WIDTH_PX * DOWN_ARROW_SCALE,
              }
            : {
                width: toScaledPx(ARROW_WIDTH_PX),
                height: toScaledPx(ARROW_HEIGHT_PX),
              }
        }
      >
        <ArrowSvg
          className={cn(
            'absolute',
            isPortrait &&
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90',
          )}
          style={
            isPortrait
              ? {
                  width: ARROW_WIDTH_PX * DOWN_ARROW_SCALE,
                  height: ARROW_HEIGHT_PX * DOWN_ARROW_SCALE,
                }
              : { width: '100%', height: '100%' }
          }
        />
      </div>
    </div>
  );
}
