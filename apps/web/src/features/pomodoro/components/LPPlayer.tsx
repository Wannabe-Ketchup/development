import LPPlayerSvg from '@/assets/lp_player.svg?react';
import { NoteAnimation } from './NoteAnimation';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

export function LPPlayer() {
  const { playState, toggleMusic } = useMusicPlayer();

  return (
    <div className="absolute top-23.5 left-0">
      {playState === 'playing' && <NoteAnimation />}
      <LPPlayerSvg
        className="pointer-events-none cursor-pointer *:pointer-events-auto [&_.lp-outline]:opacity-0 hover:[&_.lp-outline]:opacity-100"
        onClick={toggleMusic}
      />
    </div>
  );
}
