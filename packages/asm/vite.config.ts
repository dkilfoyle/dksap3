/* eslint-disable header/header */
import { defineConfig } from "vite";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig(() => {
  const config = {
    build: {
      target: "esnext",
    },
    resolve: {
      dedupe: ["vscode"],
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [importMetaUrlPlugin],
      },
    },
    server: {
      port: 5173,
    },
  };
  return config;
});
