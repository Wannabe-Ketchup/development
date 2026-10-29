import { forwardRef } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import RoundTableSvg from '@/assets/round_table.svg?react';
import TomatoStudyingSvg from '@/assets/tomato_studying.svg?react';
import PencilSvg from '@/assets/pencil.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { RoomEntryPopover } from './RoomEntryPopover';

interface TableSectionProps {
  tomatoStatus: TomatoState['status'];
  onCancel: () => void;
}

export const TableSection = forwardRef<HTMLDivElement, TableSectionProps>(
  ({ tomatoStatus, onCancel }, ref) => {
    return (
      <div className="relative pt-17" ref={ref}>
        {tomatoStatus === 'dragging' && (
          <WobblyBox
            aria-hidden="true"
            className="pointer-events-none"
            style={{
              position: 'absolute',
              display: 'block',
              inset: -48,
              width: 'calc(100% + 96px)',
              height: 'calc(100% + 96px)',
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
          <div className="absolute inset-x-0 -top-5 mx-auto w-fit">
            <TomatoStudyingSvg aria-hidden="true" />
            <div className="absolute -right-5 -bottom-1 z-10 size-15 overflow-hidden">
              <PencilSvg aria-hidden="true" className="animate-pencil-slide" />
            </div>
            <RoomEntryPopover onClose={onCancel} />
          </div>
        )}
        <RoundTableSvg aria-hidden="true" className="relative" />
      </div>
    );
  },
);

TableSection.displayName = 'TableSection';
