import { render } from '@testing-library/react';
import { INTRO_BOOK_FACES } from './IntroBookFaces';

describe('INTRO_BOOK_FACES', () => {
  it('왼쪽 면(홀수 쪽)마다 heading이 있고 면의 제목과 같다', () => {
    // given
    const leftFaces = INTRO_BOOK_FACES.filter((_, index) => index % 2 === 0);

    leftFaces.forEach((face) => {
      // when
      const { container, unmount } = render(<>{face.content}</>);

      // then
      expect(face.heading).toBeDefined();
      expect(container.querySelector('h2')?.textContent).toBe(face.heading);
      unmount();
    });
  });
});
