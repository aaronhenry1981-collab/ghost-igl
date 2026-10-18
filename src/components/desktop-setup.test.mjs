import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { transformWithOxc } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Link, MemoryRouter } from 'react-router-dom'

test('rendered desktop setup distinguishes staged features and gives platform, source and audio guidance', async () => {
  const source = readFileSync(new URL('./DesktopSetup.jsx', import.meta.url), 'utf8')
  const transformed = await transformWithOxc(source, 'DesktopSetup.jsx', { jsx: { runtime: 'classic' } })
  const component = vm.runInNewContext(transformed.code.replace(/^import .*$/gm, '').replace('export default ', '') + '\nDesktopSetup', { React, Link })
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(component)))
  for (const content of ['Windows PC', 'staged build', 'Siege window', 'HDMI input', 'USB connection', 'no microphone', 'Windows output', 'manual round planner']) assert.ok(html.includes(content), content)
  assert.match(html, /href="\/activate"/)
  assert.match(html, /href="\/support"/)
  assert.match(html, /href="\/live"/)
  assert.doesNotMatch(html, /fully supported|first-class|auto-clips/)
})
