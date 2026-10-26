import LPPlayerSvg from '@/assets/lp_player.svg?react';
import { IconButton } from '@/components/IconButton';
import { NoteAnimation } from './NoteAnimation';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

export function LPPlayer() {
  const { playState, toggleMusic } = useMusicPlayer();
  const label = playState === 'playing' ? '음악 중지' : '음악 재생';

  return (
    <div data-tour-id="lp-player" className="absolute top-23.5 left-0">
      {playState === 'playing' && <NoteAnimation />}
      <IconButton
        label={label}
        icon={LPPlayerSvg}
        iconClassName="pointer-events-none cursor-pointer *:pointer-events-auto [&_.lp-outline]:opacity-0 hover:[&_.lp-outline]:opacity-100"
        aria-busy={playState === 'loading'}
        disabled={playState === 'loading'}
        className="pointer-events-none"
        onClick={toggleMusic}
      />
    </div>
  );
}
