import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
const source = new URL('../../', import.meta.url), out = new URL((process.argv[2] || 'dist-squad-preview').replace(/\/$/, '') + '/', source)
const html = readFileSync(new URL('squad-demo.html', out), 'utf8')
if (!html.includes('/squad-preview/assets/')) throw new Error('Build must use the dedicated preview base')
const assetPaths = [...html.matchAll(/(?:src|href)="\/squad-preview\/([^"?]+)"/g)].map(match => match[1])
const index = html.replace('</head>', '    <link rel="manifest" href="/squad-preview/manifest.webmanifest" />\n  </head>')
writeFileSync(new URL('index.html', out), index)
const manifest = { id: '/squad-preview/', name: 'Recon Squad Preview', short_name: 'Recon Preview', description: 'Private squad coordination preview. Availability is shown in the app. No automatic game observation.',
  start_url: '/squad-preview/', scope: '/squad-preview/', display: 'standalone', background_color: '#151616', theme_color: '#151616',
  icons: [192, 512].map(size => ({ src: `icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })) }
writeFileSync(new URL('manifest.webmanifest', out), JSON.stringify(manifest, null, 2))
mkdirSync(new URL('icons/', out), { recursive: true })
for (const size of [192, 512]) {
  const icon = readFileSync(new URL(`public/favicon-${size}.png`, source))
  if (icon.readUInt32BE(16) !== size || icon.readUInt32BE(20) !== size) throw new Error('Icon dimensions differ')
  writeFileSync(new URL(`icons/icon-${size}.png`, out), icon)
}
const core = readFileSync(new URL('src/features/squad/pwa/worker-core.mjs', source))
const corePath = `worker-core-${createHash('sha256').update(core).digest('hex').slice(0, 16)}.mjs`
writeFileSync(new URL(corePath, out), core)
const files = ['index.html', 'manifest.webmanifest', corePath, 'icons/icon-192.png', 'icons/icon-512.png', ...assetPaths]
const hashes = Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL(file, out))).digest('hex')]))
const version = createHash('sha256').update(JSON.stringify(hashes)).digest('hex').slice(0, 16)
const worker = `import { createShellCache } from './${corePath}';\nconst handlers=createShellCache({scope:self.registration.scope,assets:${JSON.stringify(files)},assetHashes:${JSON.stringify(hashes)},version:${JSON.stringify(version)},cacheStorage:caches,fetchImpl:fetch});\nself.addEventListener('install',e=>e.waitUntil(handlers.install()));\nself.addEventListener('activate',e=>e.waitUntil(handlers.activate().then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{const response=handlers.handle(e.request);if(response)e.respondWith(response)});\nself.addEventListener('message',e=>{if(e.data==='ACTIVATE_PREVIEW_UPDATE'&&e.source?.url?.startsWith(self.registration.scope))self.skipWaiting()});\n`
writeFileSync(new URL('sw.js', out), worker)
hashes['sw.js'] = createHash('sha256').update(worker).digest('hex')
writeFileSync(new URL('preview-file-sha256.json', out), JSON.stringify(hashes, null, 2))
console.log(JSON.stringify({ version, files: Object.keys(hashes), scope: manifest.scope, publicUrl: null }, null, 2))
