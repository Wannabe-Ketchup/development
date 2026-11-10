import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { WobblyBox } from '@squiggle-line/react';
import { useStageScale } from '@/hooks/useStageScale';
import { useViewportSize } from '@/hooks/useViewportSize';
import { cn } from '@/lib/cn';
import { getFitScale } from '@/lib/fit-scale';

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
  const stageScale = useStageScale();
  const viewportSize = useViewportSize();
  const [dialogSize, setDialogSize] = useState({ width: 0, height: 0 });
  // 화면이 축소 중이면 같은 배율로 줄이고, 모달이 화면보다 크면(폰 등) 모양은 그대로 둔 채 화면에 맞게 더 줄인다
  const scale = Math.min(stageScale, getFitScale(dialogSize, viewportSize));
  const isDismissible = onClose !== undefined;

  // 마운트되면 모달로 연다. StrictMode 이중 실행 대비로 open을 확인한다.
  // 언마운트하면 DOM에서 빠지며 top layer에서도 사라지므로 cleanup에서 close()하지 않는다
  // (close()는 비동기 close 이벤트로 onClose를 불러, 재실행된 effect가 연 모달을 닫아 버린다)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  // borderBoxSize·offset*은 transform 전 크기라, 줄인 뒤에도 원래 크기로 배율을 계산한다.
  // 첫 화면에 큰 모달이 잠깐 보이지 않게 그리기 전에 한 번 재고, 이후 크기 변화는 관찰한다
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    setDialogSize({ width: dialog.offsetWidth, height: dialog.offsetHeight });
    const observer = new ResizeObserver(([entry]) => {
      const [borderBox] = entry.borderBoxSize;
      setDialogSize({
        width: borderBox.inlineSize,
        height: borderBox.blockSize,
      });
    });
    observer.observe(dialog);
    return () => observer.disconnect();
  }, []);

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- 바깥 클릭 닫기. 키보드는 dialog 기본 Esc가 담당
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="fixed inset-auto top-1/2 left-1/2 m-0 max-h-none w-max max-w-none -translate-x-1/2 -translate-y-1/2 overflow-visible bg-transparent p-0 backdrop:bg-black/32"
      // showModal()은 top layer에 그려져 축소 스테이지의 transform을 받지 않으므로 배율을 직접 건다.
      // 화면보다 커도 브라우저 기본 max-width/height로 찌그러지지 않게 풀고, 가운데 기준(translate + 기본 origin)으로 줄여 중앙을 유지한다.
      // WobblyBox는 contentRect(transform 전 크기)로 재서 테두리가 어긋나지 않는다
      style={{ transform: `scale(${scale})` }}
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
