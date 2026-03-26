import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@gz/question-widgets": path.resolve(__dirname, "./packages/question-widgets/src/index.ts"),
    },
  },
  server: {
    host: true, // listen on 0.0.0.0 so other devices on the same Wi‑Fi can open http://<laptop-ip>:3000
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
