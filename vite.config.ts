import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Saat `npm run dev`, /api diteruskan ke backend agar browser tidak kena CORS
  // (di Netlify lewat redirect di netlify.toml). Target bisa diganti lewat env API_PROXY_TARGET.
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'https://infra-lab.my.id',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
