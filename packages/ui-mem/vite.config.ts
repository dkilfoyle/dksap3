import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../../apps/ide/public",
    rollupOptions: {
      output: {
        entryFileNames: `memview.js`,
        chunkFileNames: `memview.js`,
        assetFileNames: `memview.[ext]`,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
