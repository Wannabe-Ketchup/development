import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from 'react';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import { useStageScale } from '@/hooks/useStageScale';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useViewportSize } from '@/hooks/useViewportSize';
import { cn } from '@/lib/cn';
import { getFitScale } from '@/lib/fit-scale';
import { useBookFlip } from '../hooks/useBookFlip';
import {
  BOOKMARKS,
  BOOK_SIZE_PX,
  FLIP_DURATION_MS,
  SHEET_COUNT,
  SPREAD_COUNT,
  getBookmarkOwner,
  getClickDirection,
  getSheetLayout,
  type FlipDirection,
} from '../lib/intro-book';
import {
  BOOK_ARTWORK,
  BOOK_FRAME_INSETS_PX,
  BOOKMARK_FILL_CLASS_NAMES,
} from '../lib/intro-book-artwork';
import { PAPER_BOUNDS_PX } from '../lib/intro-book-traced-paths';
import {
  IntroBookBoardArtwork,
  IntroBookBookmarkArtwork,
  IntroBookNextIcon,
  IntroBookPaperArtwork,
  IntroBookPreviousIcon,
  IntroBookRoundButtonArtwork,
} from './IntroBookArtwork';
import { INTRO_BOOK_FACES } from './IntroBookFaces';

const BOOK_PERSPECTIVE_PX = 2400;
// 종이 그림은 면(470×580)보다 작다. 쪽 내용은 종이 그림 안쪽에만 놓는다
const PAPER_CONTENT_INSET_PX = {
  top: PAPER_BOUNDS_PX.top,
  bottom: BOOK_ARTWORK.paperHeight - PAPER_BOUNDS_PX.bottom,
  outer: BOOK_ARTWORK.paperWidth - PAPER_BOUNDS_PX.outer,
} as const;
const ROUND_BUTTON_CLASS_NAME =
  'relative grid size-13.5 place-items-center rounded-full bg-transparent text-black focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-black focus-visible:outline-dashed';

interface IntroBookProps {
  isOpen: boolean;
  // dialog close 이벤트(Esc·X·바깥 클릭 모두)에서 한 번만 불린다
  onClose: () => void;
}

export function IntroBook({ isOpen, onClose }: IntroBookProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bookAreaRef = useRef<HTMLDivElement>(null);
  const backdropPressTargetRef = useRef<EventTarget | null>(null);
  const stageScale = useStageScale();
  const viewportSize = useViewportSize();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { spread, isFlipping, goTo, flip, reset } = useBookFlip();
  const [dialogSize, setDialogSize] = useState({ width: 0, height: 0 });
  // 책갈피로 고른 펼침. 넘김이 끝나면 그 장 제목으로 포커스를 옮긴다
  const [focusSpread, setFocusSpread] = useState<number | null>(null);
  const scale = Math.min(stageScale, getFitScale(dialogSize, viewportSize));
  const flipDurationMs = prefersReducedMotion ? 0 : FLIP_DURATION_MS;

  // dialog의 열고 닫기만 맞춘다
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [isOpen]);

  // 이전·다음 넘김은 다시 누르기 쉽게 포커스를 그대로 두고, 책갈피는 고른 장을 바로 읽도록 제목으로 옮긴다
  useEffect(() => {
    if (focusSpread === null || isFlipping || spread !== focusSpread) return;
    const heading = bookAreaRef.current?.querySelector<HTMLElement>(
      `[data-page="${2 * spread - 1}"] h2`,
    );
    // 제목은 Tab 순서에 넣지 않고 코드로만 포커스를 받게 한다
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    setFocusSpread(null);
  }, [focusSpread, isFlipping, spread]);

  // offset*은 transform 전 크기라, 줄인 뒤에도 원래 크기로 배율을 계산한다 (Modal과 같은 방식)
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
      aria-labelledby="intro-book-title"
      className="fixed inset-auto top-1/2 left-1/2 m-0 max-h-none w-max max-w-none -translate-x-1/2 -translate-y-1/2 overflow-visible bg-transparent p-0 backdrop:bg-[#675a4d]/42"
      style={{ transform: `scale(${scale})` }}
      onClose={() => {
        // 닫힌 dialog는 그려지지 않아 넘김 애니메이션 없이 첫 장으로 돌아간다
        reset();
        setFocusSpread(null);
        onClose();
      }}
      onKeyDown={(e) => {
        // Esc는 dialog 기본 cancel에 맡긴다. 키를 누르고 있어서 반복되는 입력은 무시한다
        if (e.repeat) return;
        if (e.key === 'ArrowRight') flip('next');
        if (e.key === 'ArrowLeft') flip('prev');
      }}
      onPointerDown={(e) => {
        const isBackdrop =
          e.target === e.currentTarget ||
          e.target === frameRef.current ||
          e.target === bookAreaRef.current;
        backdropPressTargetRef.current = isBackdrop ? e.target : null;
      }}
      onPointerUp={(e) => {
        if (e.target !== backdropPressTargetRef.current)
          backdropPressTargetRef.current = null;
      }}
      onClick={(e) => {
        if (e.target === backdropPressTargetRef.current)
          dialogRef.current?.close();
        backdropPressTargetRef.current = null;
      }}
    >
      {/* 애니메이션 안전 여백도 바깥 클릭으로 처리하고, 책과 조작부만 클릭을 소비한다 */}
      <div
        ref={frameRef}
        className="relative flex flex-col items-start gap-16"
        style={{
          paddingTop: BOOK_FRAME_INSETS_PX.top,
          paddingRight: BOOK_FRAME_INSETS_PX.right,
          paddingBottom: BOOK_FRAME_INSETS_PX.bottom,
          paddingLeft: BOOK_FRAME_INSETS_PX.left,
        }}
      >
        <h2 id="intro-book-title" className="sr-only">
          워너비케챱 사용 설명서
        </h2>
        <div
          ref={bookAreaRef}
          className="relative"
          style={{ width: BOOK_SIZE_PX.width, height: BOOK_SIZE_PX.height }}
        >
          <IntroBookSheets
            spread={spread}
            isFlipping={isFlipping}
            flipDurationMs={flipDurationMs}
            onFlip={flip}
          />
          {/* 시각적으로는 책 뒤(z-0)에 있고, 읽는 순서는 책 면 다음이다 */}
          <IntroBookBookmarks
            spread={spread}
            onSelect={(target) => {
              // 넘기는 중에는 goTo가 입력을 버리므로 포커스 이동도 예약하지 않는다
              if (isFlipping) return;
              setFocusSpread(target);
              goTo(target);
            }}
          />
        </div>
        <IntroBookControls spread={spread} onFlip={flip} />
        <div
          className="absolute top-2 size-13.5"
          style={{ left: BOOK_FRAME_INSETS_PX.left + BOOK_SIZE_PX.width + 72 }}
        >
          <IntroBookRoundButtonArtwork />
          <IconButton
            label="닫기"
            icon={CloseSvg}
            iconClassName="w-5.5"
            onClick={() => dialogRef.current?.close()}
            className={ROUND_BUTTON_CLASS_NAME}
          />
        </div>
      </div>
    </dialog>
  );
}

interface IntroBookSheetsProps {
  spread: number;
  isFlipping: boolean;
  flipDurationMs: number;
  onFlip: (direction: FlipDirection) => void;
}

// 종이 SHEET_COUNT장을 한 번만 렌더한다. 넘김은 종이의 rotateY와 쌓임 순서만 바꾼다.
// 종이 k의 앞면은 2k쪽(오른쪽), 뒷면은 2k+1쪽(왼쪽)이다. 0쪽은 없어 종이 0은 뒷면(차례)만 있다
function IntroBookSheets({
  spread,
  isFlipping,
  flipDurationMs,
  onFlip,
}: IntroBookSheetsProps) {
  const halfDurationMs = flipDurationMs / 2;

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- 면 클릭 넘김. 키보드는 방향키와 이전·다음 버튼이 담당
    <div
      className="pointer-events-none absolute inset-0 z-10"
      onClick={(e) => {
        // 면 안의 버튼 클릭은 넘김으로 보지 않는다
        if (e.target instanceof Element && e.target.closest('button')) return;
        onFlip(
          getClickDirection(e.clientX, e.currentTarget.getBoundingClientRect()),
        );
      }}
    >
      {/* 표지판은 양쪽 맨 아래에 고정되고, 종이만 그 위에서 넘어간다 */}
      <div className="absolute top-0 left-0 h-full w-1/2">
        <IntroBookBoardArtwork side="left" />
      </div>
      <div className="absolute top-0 left-1/2 h-full w-1/2">
        <IntroBookBoardArtwork side="right" />
      </div>
      {Array.from({ length: SHEET_COUNT }, (_, sheetIndex) => {
        const { isFlipped, zIndex } = getSheetLayout(sheetIndex, spread);
        const frontPage = 2 * sheetIndex;
        const backPage = 2 * sheetIndex + 1;
        return (
          <div
            key={sheetIndex}
            className="pointer-events-auto absolute top-0 left-1/2 h-full w-1/2 origin-left transform-3d"
            style={{
              transform: `perspective(${BOOK_PERSPECTIVE_PX}px) rotateY(${isFlipped ? -180 : 0}deg)`,
              zIndex,
              // 종이가 세워지는 절반 지점에서 쌓임 순서를 바꿔 넘기는 동안 항상 위에 보이게 한다
              transition: `transform ${flipDurationMs}ms ease-in-out, z-index 0ms linear ${halfDurationMs}ms`,
            }}
          >
            {1 <= frontPage && (
              <IntroBookFace
                page={frontPage}
                spread={spread}
                isFlipping={isFlipping}
              />
            )}
            {backPage <= INTRO_BOOK_FACES.length && (
              <IntroBookFace
                page={backPage}
                spread={spread}
                isFlipping={isFlipping}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface IntroBookFaceProps {
  page: number;
  spread: number;
  isFlipping: boolean;
}

// 홀수 쪽은 종이 뒷면(왼쪽 면), 짝수 쪽은 종이 앞면(오른쪽 면)이다
function IntroBookFace({ page, spread, isFlipping }: IntroBookFaceProps) {
  const face = INTRO_BOOK_FACES[page - 1];
  const isBack = page % 2 === 1;
  // 현재 펼침의 두 면만 조작할 수 있다. 넘기는 동안은 도착 후에 조작하게 모두 막는다
  const isCurrentSpreadFace = page === 2 * spread - 1 || page === 2 * spread;
  const isInert = isFlipping || !isCurrentSpreadFace;

  return (
    <div
      inert={isInert}
      data-page={page}
      className="absolute inset-0 backface-hidden"
      style={isBack ? { transform: 'rotateY(180deg)' } : undefined}
    >
      <IntroBookPaperArtwork side={isBack ? 'left' : 'right'} />
      <div
        // 책갈피로 왔을 때 포커스를 받는 제목도 책 안 다른 버튼과 같은 포커스 표시를 쓴다
        className="absolute overflow-hidden px-11.5 pt-11 pb-10 [&_h2:focus-visible]:outline-3 [&_h2:focus-visible]:outline-offset-4 [&_h2:focus-visible]:outline-black [&_h2:focus-visible]:outline-dashed"
        style={{
          top: PAPER_CONTENT_INSET_PX.top,
          bottom: PAPER_CONTENT_INSET_PX.bottom,
          // 왼쪽 면은 바깥쪽이 왼쪽이다
          left: isBack ? PAPER_CONTENT_INSET_PX.outer : 0,
          right: isBack ? 0 : PAPER_CONTENT_INSET_PX.outer,
        }}
      >
        {face.content}
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-4.5 text-[15px] text-[#6b6863]',
            isBack ? 'left-7.5' : 'right-7.5',
          )}
        >
          {page}
        </span>
      </div>
    </div>
  );
}

interface IntroBookBookmarksProps {
  spread: number;
  onSelect: (spread: number) => void;
}

// 책 오른쪽 뒤로 삐져나온 책갈피
function IntroBookBookmarks({ spread, onSelect }: IntroBookBookmarksProps) {
  const owner = getBookmarkOwner(spread);

  return (
    <nav
      aria-label="책갈피"
      className="absolute top-12 -right-23 z-0 flex flex-col"
    >
      {BOOKMARKS.map((bookmark, index) => (
        <button
          key={bookmark.label}
          type="button"
          aria-current={owner === bookmark.spread ? 'true' : undefined}
          onClick={() => onSelect(bookmark.spread)}
          className="relative -mt-1.5 flex h-15 w-34 items-center justify-center bg-transparent pl-10 text-xl whitespace-nowrap text-black transition-transform first:mt-0 hover:translate-x-1.5 focus-visible:translate-x-1.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-black focus-visible:outline-dashed aria-[current=true]:translate-x-2.5 motion-reduce:transition-none"
        >
          <IntroBookBookmarkArtwork
            index={index}
            colorClassName={BOOKMARK_FILL_CLASS_NAMES[index]}
          />
          <span className="relative">{bookmark.label}</span>
        </button>
      ))}
    </nav>
  );
}

interface IntroBookControlsProps {
  spread: number;
  onFlip: (direction: FlipDirection) => void;
}

function IntroBookControls({ spread, onFlip }: IntroBookControlsProps) {
  return (
    <div className="flex w-full items-center justify-center gap-7 text-[22px] text-black">
      <NavButton
        label="이전 장"
        disabled={spread <= 1}
        onClick={() => onFlip('prev')}
        icon={IntroBookPreviousIcon}
      />
      <div aria-live="polite" className="min-w-22.5 text-center">
        <span>
          {spread} / {SPREAD_COUNT}
        </span>
        {/* 번호만으로는 어느 장인지 알기 어려워 왼쪽 면 제목을 함께 읽어 준다 */}
        <span className="sr-only">
          , {INTRO_BOOK_FACES[2 * spread - 2].heading}
        </span>
      </div>
      <NavButton
        label="다음 장"
        disabled={SPREAD_COUNT <= spread}
        onClick={() => onFlip('next')}
        icon={IntroBookNextIcon}
      />
    </div>
  );
}

interface NavButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function NavButton({ label, disabled, onClick, icon }: NavButtonProps) {
  return (
    <div className={cn('relative size-13.5', disabled && 'opacity-35')}>
      <IntroBookRoundButtonArtwork />
      <IconButton
        label={label}
        icon={icon}
        iconClassName="size-5.5"
        disabled={disabled}
        onClick={onClick}
        className={ROUND_BUTTON_CLASS_NAME}
      />
    </div>
  );
}
