import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gatewayTarget = (
    env.VITE_GATEWAY_BASE_URL || 'https://homelab.tail042a16.ts.net'
  ).replace(/\/$/, '')
  const gatewayApiKey = (env.GATEWAY_API_KEY || '').trim()

  const gatewayProxy: ProxyOptions = {
    target: gatewayTarget,
    changeOrigin: true,
    secure: true,
    rewrite: (requestPath) => requestPath.replace(/^\/__gateway/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (gatewayApiKey) {
          proxyReq.setHeader('Authorization', `Bearer ${gatewayApiKey}`)
        }
      })
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['cmdk', 'react', 'react-dom', 'react/jsx-runtime'],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/__gateway': gatewayProxy,
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      minify: !process.env.TAURI_ENV_DEBUG,
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
  }
})
