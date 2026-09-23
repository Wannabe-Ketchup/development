import { forwardRef } from 'react';
import RoundTable from '@/assets/round_table.svg?react';
import TomatoStudying from '@/assets/tomato_studying.svg?react';
import Pencil from '@/assets/pencil.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { RoomEntryPopover } from './RoomEntryPopover';

interface TableSectionProps {
  tomatoStatus: TomatoState['status'];
}

export const TableSection = forwardRef<HTMLDivElement, TableSectionProps>(
  ({ tomatoStatus }, ref) => {
    return (
      <div className="relative pt-17" ref={ref}>
        {/* TODO: 추후 squiggle 라이브러리 배포 시 테두리 교체 */}
        {tomatoStatus === 'dragging' && (
          <svg
            className="pointer-events-none absolute"
            style={{
              inset: -60,
              width: 'calc(100% + 120px)',
              height: 'calc(100% + 120px)',
            }}
            overflow="visible"
          >
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="11"
              fill="none"
              stroke="#bababa"
              strokeWidth="4"
              strokeDasharray="18 18"
              strokeLinecap="round"
            />
          </svg>
        )}
        {tomatoStatus === 'studying' && (
          <div className="absolute inset-x-0 -top-5 mx-auto w-fit">
            <TomatoStudying />
            <div className="absolute -right-5 -bottom-1 z-10 size-15 overflow-hidden">
              <Pencil className="animate-pencil-slide" />
            </div>
            <RoomEntryPopover />
          </div>
        )}
        <RoundTable className="relative" />
      </div>
    );
  },
);

TableSection.displayName = 'TableSection';
