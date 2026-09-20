import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// See ../docs/ARCHITECTURE.md for why this is a web app (wrapped with
// Capacitor later) rather than a native app for v1.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Coach screen calls this; forwarded to the Express backend in dev.
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
