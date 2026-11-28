import LPPlayerSvg from '@/assets/lp_player.svg?react';
import { IconButton } from '@/components/IconButton';
import { NoteAnimation } from './NoteAnimation';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

export function LPPlayer() {
  const { playState, toggleMusic } = useMusicPlayer();
  const label = playState === 'playing' ? '음악 중지' : '음악 재생';

  return (
    <div data-tour-id="lp-player" className="absolute top-20.5 left-0">
      {playState === 'playing' && <NoteAnimation />}
      <IconButton
        label={label}
        icon={LPPlayerSvg}
        iconClassName="pointer-events-none h-auto w-31 cursor-pointer *:pointer-events-auto [&_.lp-outline]:opacity-0 hover:[&_.lp-outline]:opacity-100"
        aria-busy={playState === 'loading'}
        disabled={playState === 'loading'}
        // block이어야 글줄 아래 여백 없이 그림 크기와 같아져 사용 안내 하이라이트가 LP에 맞는다
        className="pointer-events-none block"
        onClick={toggleMusic}
      />
    </div>
  );
}
