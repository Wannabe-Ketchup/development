import { PILL_CONTENT_CLASS_NAME } from './SquigglePill';

// 일시정지는 범위 밖이라 UI만 둔다(onClick 없음)
export function PausePomodoroButton() {
  return (
    <button type="button" className={PILL_CONTENT_CLASS_NAME}>
      pause
      {/* ⏸ 아이콘: Figma 막대 2개(6.4×16px, 간격 3.2px) */}
      <span aria-hidden="true" className="flex gap-[3.2px]">
        <span className="h-4 w-[6.4px] bg-black" />
        <span className="h-4 w-[6.4px] bg-black" />
      </span>
    </button>
  );
}
