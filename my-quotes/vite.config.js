import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/zenquotes': {
        target: 'https://zenquotes.io/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zenquotes/, ''),
        secure: false
      },
      '/api/quotable': {
        target: 'https://api.quotable.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quotable/, ''),
        secure: false
      },
      '/api/ninjas': {
        target: 'https://api.api-ninjas.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ninjas/, ''),
        secure: false
      }
    }
  }
})
