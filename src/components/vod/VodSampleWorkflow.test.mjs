import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { R6_DEMO_ANALYSIS } from '../../data/vodDemoR6.js'

const dependencies = createRequire(process.env.RECON_TEST_DEPENDENCY_ROOT ? join(process.env.RECON_TEST_DEPENDENCY_ROOT, 'package.json') : import.meta.url)
const { build } = await import(pathToFileURL(dependencies.resolve('vite')))
const reactPlugin = (await import(pathToFileURL(dependencies.resolve('@vitejs/plugin-react')))).default
const React = dependencies('react')
const { renderToStaticMarkup } = dependencies('react-dom/server')
async function compile(options) {
  const input = options.stdin ? fileURLToPath(new URL('./__actual-homepage-excerpt.jsx', import.meta.url)) : options.entryPoints[0]
  const virtual = { name: 'actual-homepage-excerpt', resolveId: id => options.stdin && id.replaceAll('\\', '/').endsWith('/__actual-homepage-excerpt.jsx') ? '\0actual-homepage-excerpt.jsx' : undefined, load: id => id === '\0actual-homepage-excerpt.jsx' ? options.stdin.contents : undefined }
  const result = await build({ configFile: false, root: fileURLToPath(new URL('../../..', import.meta.url)), plugins: [virtual, reactPlugin()], logLevel: 'silent', build: { ssr: input, write: false, rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'], output: { format: 'cjs' } } } })
  const output = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === 'chunk')
  const module = { exports: {} }
  new Function('module', 'exports', 'require', output.code)(module, module.exports, dependencies)
  return module.exports.default || module.exports
}

test('the image-free R6 sample is a conditional workflow, not fabricated analysis data', () => {
  assert.equal(R6_DEMO_ANALYSIS.kind, 'illustrative-workflow')
  assert.deepEqual(Object.keys(R6_DEMO_ANALYSIS).sort(), ['description', 'kind', 'steps', 'title'])
  assert.equal(R6_DEMO_ANALYSIS.steps.length, 3)
  assert.match(R6_DEMO_ANALYSIS.steps[2].text, /if a screenshot shows/i)
  assert.doesNotMatch(JSON.stringify(R6_DEMO_ANALYSIS), /"score"|recurring_weaknesses|detected_|"per_image"|Smoke|Bank|chest.height|head.height/)
})

test('the actual sample renderer has no score, fake image, detected labels or recurring diagnosis', async () => {
  const Sample = await compile({ entryPoints: [fileURLToPath(new URL('./VodSampleWorkflow.jsx', import.meta.url))] })
  const html = renderToStaticMarkup(React.createElement(Sample))
  assert.match(html, /Illustrative screenshot-review workflow/)
  assert.match(html, /No gameplay image was analyzed/)
  assert.doesNotMatch(html, /Score:|\/100|<img|What went wrong|Recurring weaknesses|Patterns across|CEO Office/)
  for (const step of R6_DEMO_ANALYSIS.steps) assert.ok(html.includes(step.label))
})

test('the actual homepage excerpt renders the same workflow without a fabricated screenshot or mistake', async () => {
  const path = new URL('../../pages/LandingPage.jsx', import.meta.url), source = readFileSync(path, 'utf8')
  const constants = source.slice(source.indexOf('const SAMPLE_REVIEW_PLACE'), source.indexOf('const BOARD_MISSION'))
  const start = source.indexOf('<figure className="review-sample">'), end = source.indexOf('</figure>', start)
  assert.ok(start >= 0 && end > start)
  const dataPath = fileURLToPath(new URL('../../data/vodDemoR6.js', import.meta.url)).replaceAll('\\', '/')
  const contents = `import {R6_DEMO_ANALYSIS} from ${JSON.stringify(dataPath)}; import {Link} from 'react-router-dom'; ${constants}; export default function Excerpt(){return (${source.slice(start, end + 9)})}`
  const Excerpt = await compile({ stdin: { contents } })
  const { MemoryRouter } = dependencies('react-router-dom')
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Excerpt)))
  assert.match(html, /Illustrative workflow/)
  assert.match(html, /vod\?demo=1/)
  assert.doesNotMatch(html, /Score:|\/100|Smoke|CEO Office|Crosshair on the door frame/)
  for (const step of R6_DEMO_ANALYSIS.steps) assert.ok(html.includes(step.label))
})

test('the unchanged real and saved analysis renderer retains its legacy display contract', async () => {
  const Results = await compile({ entryPoints: [fileURLToPath(new URL('./SessionResults.jsx', import.meta.url))] })
  const analysis = { session: { headline: 'Saved review fixture', score: 88 }, per_image: [], patterns: {}, practice_plan: {} }
  const html = renderToStaticMarkup(React.createElement(Results, { analysis }))
  assert.match(html, /Saved review fixture/)
  assert.match(html, /Score: 88\/100/)
  assert.doesNotMatch(html, /Illustrative screenshot-review workflow/)
})
