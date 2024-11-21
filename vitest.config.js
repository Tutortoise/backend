import { config } from "dotenv";
import path from "path";

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@controllers": path.resolve(__dirname, "./src/controllers"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@schemas": path.resolve(__dirname, "./src/schemas"),
      "@middleware": path.resolve(__dirname, "./src/middleware"),
      "@services": path.resolve(__dirname, "./src/services"),
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
