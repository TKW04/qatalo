// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ protocolImports: true }),
  ],
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
      global: "globalthis",
    },
  },
  // 👇 define global también a nivel de Vite (opcional, útil si alguna lib lo usa en runtime)
  define: {
    global: "globalThis",
    "process.env": "{}",        // ⬅️ IMPORTANTE: string, NO objeto
  },
  optimizeDeps: {
    include: ["buffer", "process"],
    esbuildOptions: {
      define: {
        global: "globalThis",
        "process.env": "{}",    // ⬅️ IMPORTANTE: string, NO objeto
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});