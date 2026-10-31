import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
const mocks=fileURLToPath(new URL('./mocks.jsx',import.meta.url))
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:4180,strictPort:true},resolve:{alias:['../hooks/useAuth','../features/live-coach/api','../features/live-coach/capture.mjs','../features/live-coach/recording.mjs'].map(find=>({find,replacement:mocks}))}})
