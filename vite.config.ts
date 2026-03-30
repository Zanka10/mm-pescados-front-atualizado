import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '::',
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3333',
          changeOrigin: true,
        }
      }
    }
  }
})
