import wall from '../../assets/wall.png';
import floor from '../../assets/floor.png';
import Desk from '../../assets/desk.svg?react';
import Lamp from '../../assets/lamp.svg?react';
import Shelf from '../../assets/shelf.svg?react';
import LPPlayer from '../../assets/lp_player.svg?react';

function Pomodoro() {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      {/* 배경 레이어 */}
      <div className="grid h-full w-full grid-cols-1 grid-rows-[6fr_4fr]">
        <img
          className="h-full min-h-0 w-full object-cover object-bottom"
          src={wall}
          alt="벽 이미지"
        />
        <img
          className="h-full min-h-0 w-full object-cover object-top"
          src={floor}
          alt="바닥 이미지"
        />
      </div>

      {/* 콘텐츠 레이어 */}
      <div className="absolute inset-0">
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2">
          <Desk />
          <Lamp className="absolute bottom-18 -left-38 [&_.lamp-outline]:opacity-0 hover:[&_.lamp-outline]:opacity-100" />
        </div>
        <div className="absolute right-14.5 bottom-[40%]">
          <Shelf />
          <LPPlayer className="absolute top-23.5 left-0 [&_.lp-outline]:opacity-0 hover:[&_.lp-outline]:opacity-100" />
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;
