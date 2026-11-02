import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  publicDir: false,
  plugins: [react()], server: { host: '127.0.0.1', port: 5688, strictPort: true },
  build: { outDir: '../prototype-dist.2', emptyOutDir: false,
    rollupOptions: { input: fileURLToPath(new URL('./squad-demo.html', import.meta.url)) } },
})
