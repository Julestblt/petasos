import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hermesTarget = (env.VITE_HERMES_BASE_URL || 'http://127.0.0.1:8642').replace(
    /\/$/,
    '',
  )
  const metricsTarget = (env.VITE_HOST_METRICS_URL || '').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/__hermes': {
          target: hermesTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/__hermes/, ''),
        },
        ...(metricsTarget
          ? {
              '/__metrics': {
                target: metricsTarget,
                changeOrigin: true,
                secure: true,
                rewrite: (requestPath: string) =>
                  requestPath.replace(/^\/__metrics/, ''),
              },
            }
          : {}),
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
