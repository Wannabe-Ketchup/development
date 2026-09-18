import { useState, useRef, useEffect } from 'react';
import { fetchRandomMusicUrl } from '../../../api/music';

type MusicPlayerState = 'idle' | 'loading' | 'playing';

export function useMusicPlayer() {
  const [playState, setPlayState] = useState<MusicPlayerState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = () => {
    if (playState === 'idle') {
      playMusic();
    } else if (playState === 'playing') {
      stopMusic();
    }
  };

  const playMusic = async () => {
    setPlayState('loading');
    try {
      const url = await fetchRandomMusicUrl();
      const audio = new Audio(url);

      // 음악이 끝나면 idle로 상태를 바꿈
      audio.onended = () => {
        audioRef.current = null;
        setPlayState('idle');
      };

      audioRef.current = audio;
      await audio.play();
      setPlayState('playing');
    } catch (error) {
      console.error(error);
      audioRef.current = null;
      setPlayState('idle');
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayState('idle');
  };

  return { playState, toggleMusic };
}
