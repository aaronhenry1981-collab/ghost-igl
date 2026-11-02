import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const files = ['src/features/squad', 'src/features/squad/pwa', 'lambda/squad'].flatMap(dir => readdirSync(new URL(`../../${dir}/`, import.meta.url)).filter(name => name.endsWith('.test.mjs')).map(name => `${dir}/${name}`))
const guard = new URL('../test-netguard.mjs', import.meta.url).href
const options = [process.env.NODE_OPTIONS, `--import=${guard}`].filter(Boolean).join(' ')
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: options } })
process.exit(result.status ?? 1)
