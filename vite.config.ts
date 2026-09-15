import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

type ProxyRule = {
  target: string
  changeOrigin: boolean
  secure: boolean
  rewrite: (requestPath: string) => string
}

function buildPathProxy(configured: string, localPrefix: string): ProxyRule | undefined {
  try {
    const parsed = new URL(configured)
    const remotePath = parsed.pathname.replace(/\/$/, '') || ''
    return {
      target: parsed.origin,
      changeOrigin: true,
      secure: true,
      rewrite: (requestPath: string) =>
        requestPath.replace(new RegExp(`^${localPrefix}`), remotePath),
    }
  } catch {
    return undefined
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hermesTarget = (env.VITE_HERMES_BASE_URL || 'http://127.0.0.1:8642').replace(
    /\/$/,
    '',
  )
  const metricsProxy = buildPathProxy(
    (env.VITE_HOST_METRICS_URL || '').trim(),
    '/__metrics',
  )
  const codexProxy = buildPathProxy((env.VITE_CODEX_USAGE_URL || '').trim(), '/__codex')
  const openCodeGoProxy = buildPathProxy(
    (env.VITE_OPENCODE_GO_USAGE_URL || 'https://opencode.ai/zen/go/v1/usage').trim(),
    '/__opencode-go',
  )

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
        ...(metricsProxy ? { '/__metrics': metricsProxy } : {}),
        ...(codexProxy ? { '/__codex': codexProxy } : {}),
        ...(openCodeGoProxy ? { '/__opencode-go': openCodeGoProxy } : {}),
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
