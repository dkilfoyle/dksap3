import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";
import * as fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: "**/*.html",
  publicDir: "public",
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
    include: ["vscode-textmate", "vscode-oniguruma"],
  },
  plugins: [
    react(),
    {
      // For the *-language-features extensions which use SharedArrayBuffer
      name: "configure-response-headers",
      apply: "serve",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          next();
        });
      },
    },
    {
      name: "force-prevent-transform-assets",
      apply: "serve",
      configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            if (req.originalUrl != null) {
              const pathname = new URL(req.originalUrl, import.meta.url.slice(3)).pathname;
              if (pathname.endsWith(".html")) {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                console.log(__dirname, pathname);
                res.write(fs.readFileSync(path.join(__dirname, pathname)));
                res.end();
              }
            }

            next();
          });
        };
      },
    },
  ],
});
