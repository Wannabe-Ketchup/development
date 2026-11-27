import {
  COMPACT_PILL_CONTENT_CLASS_NAME,
  ROOM_PILL_CONTENT_CLASS_NAME,
  SquigglePill,
} from '@/components/SquigglePill';

interface SessionLabelProps {
  label: string;
  isCompact?: boolean;
}

export function SessionLabel({ label, isCompact = false }: SessionLabelProps) {
  return (
    <SquigglePill>
      <div
        className={
          isCompact
            ? COMPACT_PILL_CONTENT_CLASS_NAME
            : ROOM_PILL_CONTENT_CLASS_NAME
        }
      >
        {label}
      </div>
    </SquigglePill>
  );
}
