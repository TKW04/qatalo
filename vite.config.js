// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      global: 'globalthis',
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  optimizeDeps: {
    include: ['buffer'], // 👈 fuerza a Vite a pre-empaquetar 'buffer'
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env': {}, // 👈 evita errores de process.env en libs CJS
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // 👈 permite CJS/ESM mixto (xlsx-js-style)
    },
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), // 👈 polyfills para runtime de Rollup
      ],
    },
  },
});