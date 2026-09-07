import { defineConfig } from "vite";
import { resolve } from "node:path";
import { createBillingService } from "./server/billing-service.mjs";

export default defineConfig({
  plugins: [{
    name: "shared-billing-prototype",
    configureServer(server) {
      const service = createBillingService({ filename: process.env.BILLING_DB_PATH || resolve(".data/billing.sqlite") });
      server.middlewares.use(service.middleware);
      const timer = setInterval(() => { try { service.tick(); } catch (error) { server.config.logger.error("Billing collection: " + error.message); } }, 60_000);
      timer.unref();
      server.httpServer?.once("close", () => { clearInterval(timer); service.close(); });
    }
  }],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    watch: { ignored: ["**/.data/**"] },
    fs: { deny: [".env", ".env.*", "**/.git/**", "**/.data/**", "**/server/**", "**/tests/**"] }
  }
});
