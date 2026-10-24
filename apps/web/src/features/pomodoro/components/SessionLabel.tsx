import { PILL_CONTENT_CLASS_NAME, SquigglePill } from './SquigglePill';

interface SessionLabelProps {
  label: string;
}

export function SessionLabel({ label }: SessionLabelProps) {
  return (
    <SquigglePill>
      <div className={PILL_CONTENT_CLASS_NAME}>{label}</div>
    </SquigglePill>
  );
}
