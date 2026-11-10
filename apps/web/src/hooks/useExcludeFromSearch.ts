import { useEffect } from 'react';

const ROBOTS_NOINDEX_CONTENT = 'noindex';

// isExcluded가 true인 동안 robots noindex meta를 넣고 홈을 가리키는 canonical을 떼며, 해제하면 되돌린다.
export function useExcludeFromSearch(isExcluded: boolean): void {
  useEffect(() => {
    if (!isExcluded) return;

    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = ROBOTS_NOINDEX_CONTENT;
    document.head.appendChild(robots);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    canonical?.remove();

    return () => {
      robots.remove();
      if (canonical) document.head.appendChild(canonical);
    };
  }, [isExcluded]);
}
