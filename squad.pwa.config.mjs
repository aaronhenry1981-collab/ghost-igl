import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { squadEndpoints } from './src/features/squad/endpoint-config.mjs'
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  squadEndpoints(env.VITE_SQUAD_API_BASE_URL, env.VITE_SQUAD_WS_BASE_URL)
  return {
  base: '/squad-preview/', publicDir: false, plugins: [react()],
  build: { outDir: process.env.SQUAD_OUTPUT_DIR || 'dist-squad-preview', emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('./squad-demo.html', import.meta.url)) } },
  }
})
