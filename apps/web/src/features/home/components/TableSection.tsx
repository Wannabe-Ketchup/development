import { forwardRef, type Ref } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import RoundTableSvg from '@/assets/round_table.svg?react';
import TomatoStudyingSvg from '@/assets/tomato_studying.svg?react';
import PencilSvg from '@/assets/pencil.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { toScaledPx, type HomeLayout } from '../lib/home-layout';
import { HOME_ARTWORK_PX } from '../lib/home-artwork';
import { RoomEntryPopover } from './RoomEntryPopover';

interface TableSectionProps {
  tomatoStatus: TomatoState['status'];
  layout: HomeLayout;
  popoverRef: Ref<HTMLDivElement>;
  onCancel: () => void;
}

export const TableSection = forwardRef<HTMLDivElement, TableSectionProps>(
  ({ tomatoStatus, layout, popoverRef, onCancel }, ref) => {
    return (
      <div
        className="relative"
        style={{ paddingTop: toScaledPx(HOME_ARTWORK_PX.table.paddingTop) }}
        ref={ref}
        data-testid="table"
      >
        {tomatoStatus === 'dragging' && (
          <WobblyBox
            aria-hidden="true"
            className="pointer-events-none"
            style={{
              position: 'absolute',
              display: 'block',
              inset: 'calc(var(--home-drop) * -1)',
              width: 'calc(100% + var(--home-drop) * 2)',
              height: 'calc(100% + var(--home-drop) * 2)',
            }}
            wiggle={2}
            padding={12}
            borderRadius={11}
            strokeWidth={4}
            dashLength={18}
            dashGap={18}
            strokeDashoffset={20}
            pathClassName="stroke-gray"
          >
            <div className="size-full" />
          </WobblyBox>
        )}
        {tomatoStatus === 'studying' && (
          <div
            className="absolute inset-x-0 mx-auto w-fit"
            style={{ top: toScaledPx(HOME_ARTWORK_PX.studyingTomato.top) }}
          >
            <TomatoStudyingSvg
              aria-hidden="true"
              style={{
                width: toScaledPx(HOME_ARTWORK_PX.studyingTomato.width),
                height: toScaledPx(HOME_ARTWORK_PX.studyingTomato.height),
              }}
            />
            <div
              className="absolute z-10 overflow-hidden"
              style={{
                right: toScaledPx(HOME_ARTWORK_PX.pencil.right),
                bottom: toScaledPx(HOME_ARTWORK_PX.pencil.bottom),
                width: toScaledPx(HOME_ARTWORK_PX.pencil.frame),
                height: toScaledPx(HOME_ARTWORK_PX.pencil.frame),
              }}
            >
              <PencilSvg
                aria-hidden="true"
                className="animate-pencil-slide"
                style={{
                  width: toScaledPx(HOME_ARTWORK_PX.pencil.spriteWidth),
                  height: toScaledPx(HOME_ARTWORK_PX.pencil.height),
                }}
              />
            </div>
            <RoomEntryPopover
              layout={layout}
              popoverRef={popoverRef}
              onClose={onCancel}
            />
          </div>
        )}
        <RoundTableSvg
          aria-hidden="true"
          className="relative"
          style={{
            width: toScaledPx(HOME_ARTWORK_PX.table.width),
            height: toScaledPx(HOME_ARTWORK_PX.table.height),
          }}
        />
      </div>
    );
  },
);

TableSection.displayName = 'TableSection';
