import { useEffect, useState } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

function readViewportSize(): ViewportSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState(readViewportSize);

  useEffect(() => {
    const handleResize = () => {
      const next = readViewportSize();
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
