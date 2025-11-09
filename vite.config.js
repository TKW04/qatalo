// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    // Polyfills de Node para el navegador (buffer, process, etc.)
    nodePolyfills({
      protocolImports: true, // permite importar 'node:buffer' si alguna lib lo usa
      // si quieres, puedes habilitar polyfills adicionales:
      // globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: {
      // Fuerza a que 'buffer' y 'process' se resuelvan a los polyfills del navegador
      buffer: "buffer",
      process: "process/browser",
      global: "globalthis",
    },
  },
  optimizeDeps: {
    // 🔴 LO CLAVE: que Vite preempaque estos módulos (si no, los marca como externos)
    include: ["buffer", "process"],
    esbuildOptions: {
      define: {
        global: "globalThis",
        "process.env": {}, // evita fallos de process.env en librerías CJS
      },
    },
  },
  build: {
    // Permite módulos mixtos CJS/ESM (xlsx-js-style y amigos)
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});