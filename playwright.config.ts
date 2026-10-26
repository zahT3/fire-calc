import { defineConfig } from '@playwright/test';

const PORT = 5199;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, locale: 'zh-CN' },
  webServer: {
    command: `npx vite src/web --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'mobile-webkit', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
});
