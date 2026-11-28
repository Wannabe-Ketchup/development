import SteamSvg from '@/assets/steam.svg?react';

// 기준점은 커피잔 중심이다. 잔보다 나중에 그려 잔 앞에 보이게 한다.
// 네 칸이 이어진 그림(216px)을 한 칸(54px) 창으로 보여 준다
export function SteamAnimation() {
  return (
    <div
      data-testid="desk-prop-steam"
      className="absolute bottom-10.75 -left-6.75 size-13.5 overflow-hidden"
    >
      <SteamSvg className="h-auto w-54 max-w-none animate-steam-slide" />
    </div>
  );
}
