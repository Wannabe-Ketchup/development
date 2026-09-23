import { render, screen } from '@testing-library/react';
import Pomodoro from './features/pomodoro/page';

test('renders without crashing', () => {
  render(<Pomodoro />);
  expect(screen.getByAltText('벽 이미지')).toBeTruthy();
});
