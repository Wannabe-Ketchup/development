// ResizeObserver Mocking (Vitest JSDOM 환경용)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
