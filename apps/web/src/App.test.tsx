import { render } from '@testing-library/react';
import Pomodoro from './features/pomodoro/page';

test('renders without crashing', () => {
  const { container } = render(<Pomodoro />);
  expect(container).toBeTruthy();
});
