// Heycatch on the static pages (map guides, blog, compare, coaching …). They
// don't load the app bundle, so before this they sent nothing and Heycatch's
// funnel only ever saw the app routes. scripts/build-static-analytics.mjs
// bundles this file into dist/assets after the build and adds it to those
// pages. Same project key and the same rule as main.jsx: never on an admin
// page, and no identity (no names, emails or account IDs) is ever sent.
import { analytics } from '@heycatch/sdk'
import { analyticsEnabledFor } from './lib/analyticsScope.mjs'

if (analyticsEnabledFor(window.location.pathname)) {
  analytics.init({
    projectKey: 'hck_pk_LqdfkkyGftCKC8qKpR97GMHecXFJy_o4',
    install: {
      framework: 'web',
      agent: 'claude-code',
    },
  })
}
