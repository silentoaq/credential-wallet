import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://fido.moi.gov.tw:5000',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://fido.moi.gov.tw:5000',
        changeOrigin: true,
      },
    },
    cors: true
  }
})