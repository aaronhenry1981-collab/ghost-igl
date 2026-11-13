import { resolveVodStreamConfig } from './src/api/vodStreamConfig.mjs'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { pilotApiBase } from './src/features/live-coach/pilot-release.mjs'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Fail the production build before another disconnected coach can be published.
  if (command === 'build' && mode === 'production') pilotApiBase(loadEnv(mode, process.cwd(), 'VITE_').VITE_LIVE_COACH_API_BASE_URL)
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  resolveVodStreamConfig(env.VITE_VOD_STREAM_ENABLED, env.VITE_VOD_STREAM_URL)
  return { plugins: [react()] }
})
