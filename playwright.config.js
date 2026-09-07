const { defineConfig, devices } = require("@playwright/test");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
process.env.BILLING_DB_PATH ||= join(tmpdir(), "paywizard-billing-e2e-" + process.pid + "-" + Date.now() + ".sqlite");

const localNoProxy = ["127.0.0.1", "localhost"];
process.env.NO_PROXY = [process.env.NO_PROXY, ...localNoProxy].filter(Boolean).join(",");
process.env.no_proxy = [process.env.no_proxy, ...localNoProxy].filter(Boolean).join(",");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:8765",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 8765 --strictPort",
    url: "http://127.0.0.1:8765",
    reuseExistingServer: false,
    timeout: 10000
  }
});
