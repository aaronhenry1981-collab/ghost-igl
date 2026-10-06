import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wantsStaticAnalytics, withAnalyticsTag } from './build-static-analytics.mjs'

test('content and marketing pages report to Heycatch', () => {
  for (const page of ['guides/bank.html', 'guides/index.html', 'guides/operators/jackal.html', 'blog/r6-operator-ash.html', 'blog/index.html',
    'compare/index.html', 'author/aaron/index.html', 'coaching/index.html', 'climb/index.html', 'tools/index.html', 'countdown/index.html', '404.html']) {
    assert.equal(wantsStaticAnalytics(page), true, page)
  }
})

test('app shells, booking pages and admin never get the static script', () => {
  for (const page of ['index.html', '_shell/pricing.html', '_shell/app.html', 'booking/manage/index.html', 'coaching/booked/index.html',
    'admin/index.html', 'status/index.html', 'status.html']) {
    assert.equal(wantsStaticAnalytics(page), false, page)
  }
})

test('the tag is added once, before </body>', () => {
  const page = '<html><body><main>x</main>\n</body></html>'
  const once = withAnalyticsTag(page, '/assets/analytics-static-abc.js')
  assert.match(once, /<script type="module" src="\/assets\/analytics-static-abc\.js" data-recon-analytics><\/script>\n<\/body>/)
  assert.equal(withAnalyticsTag(once, '/assets/analytics-static-abc.js'), once)
})
