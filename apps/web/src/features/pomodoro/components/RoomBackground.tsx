import wall1280 from '@/assets/wall-1280.webp?no-inline';
import wall1920 from '@/assets/wall-1920.webp';
import wall2560 from '@/assets/wall-2560.webp';
import floor1280 from '@/assets/floor-1280.webp';
import floor1920 from '@/assets/floor-1920.webp';
import floor2560 from '@/assets/floor-2560.webp';
import { WALL_SIZES, FLOOR_SIZES } from '../image-sizes';

interface RoomBackgroundProps {
  isDarkMode: boolean;
}

// 방 화면의 벽·바닥. 미지원 화면 안내에서도 같은 배경을 깔기 위해 따로 둔다
export function RoomBackground({ isDarkMode }: RoomBackgroundProps) {
  return (
    <div className="grid h-full w-full grid-cols-1 grid-rows-[6fr_4fr]">
      <img
        className="h-full min-h-0 w-full object-cover object-bottom"
        src={wall2560}
        srcSet={`${wall1280} 1280w, ${wall1920} 1920w, ${wall2560} 2560w`}
        sizes={WALL_SIZES}
        alt=""
      />
      <img
        className="h-full min-h-0 w-full object-cover object-top"
        src={floor2560}
        srcSet={`${floor1280} 1280w, ${floor1920} 1920w, ${floor2560} 2560w`}
        sizes={FLOOR_SIZES}
        alt=""
      />

      {isDarkMode && <div className="absolute inset-0 dark-mode-overlay" />}
    </div>
  );
}
