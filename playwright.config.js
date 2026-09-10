import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174",
    headless: true,
    trace: "off",
  },
  projects: [
    {
      name: "mobile-webkit",
      testMatch: /responsive\.spec\.js/,
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: { channel: "chrome", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      use: {
        channel: "chrome",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --config tests/vite.config.js --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
