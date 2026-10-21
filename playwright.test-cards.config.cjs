const base = require("./playwright.config.js");

module.exports = {
  ...base,
  testMatch: ["test-cards.spec.js"],
  workers: 1,
  use: { ...base.use, baseURL: "http://127.0.0.1:8775" },
  webServer: {
    ...base.webServer,
    command: "npm run dev -- --host 127.0.0.1 --port 8775 --strictPort",
    url: "http://127.0.0.1:8775",
  },
};
