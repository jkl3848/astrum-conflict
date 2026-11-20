import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@astrum/game': fileURLToPath(new URL('../../packages/game/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
    },
  },
  optimizeDeps: {
    exclude: ['@astrum/game'],
  },
})

