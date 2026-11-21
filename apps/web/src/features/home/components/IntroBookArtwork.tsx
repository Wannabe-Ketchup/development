import { useId, type SVGProps } from 'react';
import { useSquigglePath } from '@squiggle-line/react';
import boardUrl from '@/assets/intro_book_board.svg';
import {
  BOOK_ARTWORK,
  BOOKMARK_PATH,
  BOOKMARK_SEEDS,
  BOOKMARK_SIZE_PX,
  GUTTER_BAND,
  ROUND_BUTTON_PATH,
  SMALL_ARTWORK_SQUIGGLE,
} from '../lib/intro-book-artwork';
import {
  BOARD_IMAGE_WIDTH_PX,
  BOARD_OUTLINE_PATH,
  PAPER_PATH,
} from '../lib/intro-book-traced-paths';

const BOOK_VIEW_BOX = `0 0 ${BOOK_ARTWORK.paperWidth} ${BOOK_ARTWORK.paperHeight}`;
// 왼쪽 면은 오른쪽 면을 책등 기준으로 뒤집어 그린다
const MIRROR_TRANSFORM = `translate(${BOOK_ARTWORK.paperWidth} 0) scale(-1 1)`;

interface IntroBookPaperArtworkProps {
  side: 'left' | 'right';
}

// 넘기는 종이 한 면. 외곽선은 표지판 그림 속 맨 위 종이와 같아서 내려앉으면 겹친다
export function IntroBookPaperArtwork({ side }: IntroBookPaperArtworkProps) {
  const clipId = useId();

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={BOOK_VIEW_BOX}
    >
      <g transform={side === 'left' ? MIRROR_TRANSFORM : undefined}>
        <clipPath id={clipId}>
          <path d={PAPER_PATH} />
        </clipPath>
        <path d={PAPER_PATH} fill={BOOK_ARTWORK.paperColor} />
        <rect
          x={GUTTER_BAND.x}
          y="0"
          width={GUTTER_BAND.width}
          height={BOOK_ARTWORK.paperHeight}
          fill={GUTTER_BAND.color}
          clipPath={`url(#${clipId})`}
        />
        <path
          d={PAPER_PATH}
          fill="none"
          stroke={BOOK_ARTWORK.inkColor}
          strokeWidth={BOOK_ARTWORK.strokeWidth}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

interface IntroBookBoardArtworkProps {
  side: 'left' | 'right';
}

// 표지판과 그 위 종이 묶음(시안에서 따낸 그림). 오른쪽은 뒤표지, 왼쪽은 앞표지 안쪽이다
export function IntroBookBoardArtwork({ side }: IntroBookBoardArtworkProps) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={BOOK_VIEW_BOX}
    >
      <g transform={side === 'left' ? MIRROR_TRANSFORM : undefined}>
        {/* 벡터화된 그림의 층 사이 틈으로 배경이 비치지 않게 같은 윤곽을 종이색으로 먼저 깐다 */}
        <path d={BOARD_OUTLINE_PATH} fill={BOOK_ARTWORK.paperColor} />
        <image
          href={boardUrl}
          x="0"
          y="0"
          width={BOARD_IMAGE_WIDTH_PX}
          height={BOOK_ARTWORK.paperHeight}
          preserveAspectRatio="none"
        />
      </g>
    </svg>
  );
}

interface IntroBookBookmarkArtworkProps {
  index: number;
  colorClassName: string;
}

export function IntroBookBookmarkArtwork({
  index,
  colorClassName,
}: IntroBookBookmarkArtworkProps) {
  const path = useSquigglePath(BOOKMARK_PATH, {
    ...SMALL_ARTWORK_SQUIGGLE,
    seed: BOOKMARK_SEEDS[index],
  });

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${BOOKMARK_SIZE_PX.width} ${BOOKMARK_SIZE_PX.height}`}
    >
      <path
        d={`${path} Z`}
        className={colorClassName}
        stroke={BOOK_ARTWORK.inkColor}
        strokeWidth={BOOK_ARTWORK.strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IntroBookRoundButtonArtwork() {
  const path = useSquigglePath(ROUND_BUTTON_PATH, SMALL_ARTWORK_SQUIGGLE);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 54 54"
    >
      <path
        d={`${path} Z`}
        fill={BOOK_ARTWORK.paperColor}
        stroke={BOOK_ARTWORK.inkColor}
        strokeWidth={BOOK_ARTWORK.strokeWidth}
      />
    </svg>
  );
}

export function IntroBookPreviousIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M 15 5 Q 12 9 8 12 Q 11 15 15 19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IntroBookNextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M 9 5 Q 12 9 16 12 Q 13 15 9 19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
