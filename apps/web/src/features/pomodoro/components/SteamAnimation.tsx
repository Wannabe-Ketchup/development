import SteamSvg from '@/assets/steam.svg?react';

// 기준점은 커피잔 중심이다. 잔보다 나중에 그려 잔 앞에 보이게 한다.
export function SteamAnimation() {
  return (
    <div
      data-testid="desk-prop-steam"
      className="absolute bottom-14 -left-8.75 h-17.75 w-17.5 overflow-hidden"
    >
      <SteamSvg className="max-w-none animate-steam-slide" />
    </div>
  );
}
