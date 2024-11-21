import { config } from "dotenv";
import path from "path";

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@middleware": path.resolve(__dirname, "./src/middleware"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
  env: {
    ...config({ path: ".env.test.local" }).parsed,
  },
  test: {
    hookTimeout: 120_000,
    globalSetup: ["./globalSetup.ts"],
  },
};
