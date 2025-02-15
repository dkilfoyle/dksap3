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
        entryFileNames: `emulator.js`,
        chunkFileNames: `emulator.js`,
        assetFileNames: `emulator.[ext]`,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
