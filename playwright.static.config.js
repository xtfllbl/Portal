process.env.NO_PROXY = [process.env.NO_PROXY, '127.0.0.1', 'localhost'].filter(Boolean).join(',');
process.env.no_proxy = process.env.NO_PROXY;
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests',testMatch:'billing-static.spec.js',timeout:30000,
  use:{baseURL:'http://127.0.0.1:8876',trace:'retain-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer:{command:'python3 -m http.server 8876 --bind 127.0.0.1 --directory dist',url:'http://127.0.0.1:8876',reuseExistingServer:false,timeout:10000}
});
