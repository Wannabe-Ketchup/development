import { useState, useRef, useEffect } from 'react';
import { fetchRandomMusicUrl } from '../../../api/music';

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

  const playMusic = async () => {
    try {
      const url = await fetchRandomMusicUrl();
      const audio = new Audio(url);

      // 음악이 끝나면 idle로 상태를 바꿈
      audio.onended = () => {
        audioRef.current = null;
        setPlayState('idle');
      };

      // 기존에 재생중인 음악이 있다면 중지
      audioRef.current?.pause();
      audioRef.current = audio;
      await audio.play();
      setPlayState('playing');
    } catch (error) {
      console.error(error);
      audioRef.current = null;
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
