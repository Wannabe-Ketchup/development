import { useState, useRef, useEffect } from 'react';
import { fetchRandomMusicUrl } from '../api/music';

type MusicPlayerState = 'idle' | 'playing';

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
    if (playState === 'playing') {
      stopMusic();
    } else {
      playMusic();
    }
  };

  const playMusic = () => {
    fetchRandomMusicUrl()
      .then((url) => {
        const audio = new Audio(url);

        // 음악이 끝나면 idle로 상태를 바꿈
        audio.onended = () => {
          audioRef.current = null;
          setPlayState('idle');
        };

        audioRef.current = audio;
        return audio.play();
      })
      .then(() => setPlayState('playing'))
      .catch((error) => {
        console.error(error);
        audioRef.current = null;
      });
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
