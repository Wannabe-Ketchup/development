import chair from '@/assets/chair.svg';

interface SeatChairProps {
  translateX: number;
}

export function SeatChair({ translateX }: SeatChairProps) {
  return (
    <img
      src={chair}
      alt="의자"
      className="absolute bottom-0 left-1/2 w-36 max-w-none transition-transform duration-300 ease-out"
      style={{ transform: `translateX(calc(-50% + ${translateX}px))` }}
    />
  );
}
