import { useEffect, useRef, type ReactNode } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { cn } from '@/lib/cn';

// 배경색은 안쪽 요소에 CSS로 칠하고 WobblyBox는 테두리만 그린다.
// 테두리 svg는 크기를 잰 뒤에야 그려지므로, 그 전에도 배경과 글자가 함께 보이게 하기 위해서다
const OUTER_WOBBLY = {
  wiggle: 4,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 32,
  pathClassName: 'fill-none stroke-black',
};

interface ModalProps {
  // 제목 요소의 id. dialog의 접근 가능한 이름이 된다
  labelledBy: string;
  // 없으면 Esc와 바깥 클릭으로 닫히지 않는다
  onClose?: () => void;
  // 안쪽 박스의 너비·정렬·간격
  className?: string;
  children: ReactNode;
}

export function Modal({
  labelledBy,
  onClose,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isBackdropPressRef = useRef(false);
  const isDismissible = onClose !== undefined;

  // 마운트되면 모달로 연다. StrictMode 이중 실행 대비로 open을 확인한다.
  // 언마운트하면 DOM에서 빠지며 top layer에서도 사라지므로 cleanup에서 close()하지 않는다
  // (close()는 비동기 close 이벤트로 onClose를 불러, 재실행된 effect가 연 모달을 닫아 버린다)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- 바깥 클릭 닫기. 키보드는 dialog 기본 Esc가 담당
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="m-auto overflow-visible bg-transparent p-0 backdrop:bg-black/32"
      onCancel={(e) => {
        if (!isDismissible) e.preventDefault();
      }}
      onClose={() => {
        // 브라우저는 반복된 Esc에서 cancel 취소를 무시하고 닫을 수 있어, 닫히지 않는 모달은 다시 연다
        if (!isDismissible) {
          dialogRef.current?.showModal();
          return;
        }
        onClose(); // Esc(cancel→close)로 닫힌 것을 상태와 동기화
      }}
      onPointerDown={(e) => {
        isBackdropPressRef.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        // 바깥에서 눌렀어도 안쪽에서 떼면 닫지 않는다 (click은 공통 조상인 dialog로 오기 때문)
        if (e.target !== e.currentTarget) isBackdropPressRef.current = false;
      }}
      onClick={(e) => {
        if (isBackdropPressRef.current && e.target === e.currentTarget)
          onClose?.();
      }}
    >
      <WobblyBox {...OUTER_WOBBLY}>
        <div
          className={cn(
            'flex flex-col rounded-[32px] bg-cream px-9 py-7',
            className,
          )}
        >
          {children}
        </div>
      </WobblyBox>
    </dialog>
  );
}
