import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // @pomodoro/shared는 pnpm 워크스페이스 심볼릭 링크 + CommonJS 빌드라,
  // Vite dev 서버가 사전 번들링(esbuild)을 거치지 않으면 브라우저가
  // CJS의 named export를 인식하지 못한다. 명시적으로 포함시켜 강제 처리한다.
  optimizeDeps: {
    include: ['@pomodoro/shared'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (
              proxyRes.headers['content-type']?.includes('text/event-stream')
            ) {
              proxyRes.headers['x-accel-buffering'] = 'no';
            }
          });
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
