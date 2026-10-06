// CloudFront Function (viewer-request) for r6coaching.com, published as
// "ghost-igl-directory-index" on distribution E2WUR8DDHCOYC9. Replaces the
// plain directory-index function. Runtime: cloudfront-js-2.0.
//
//   /blog/, /guides/ …          -> that directory's index.html (static pages)
//   /coaching, /guides …        -> 301 to the trailing-slash directory
//   /guides/bank, /blog/x       -> the .html page (404 if it doesn't exist)
//   app routes (/strats …)      -> /_shell/<route>.html: index.html with that
//                                  route's own title and canonical
//                                  (scripts/generate-route-shells.mjs)
//   /r/:code, /admin/* …        -> /_shell/app.html (one unindexed shell)
//   /strats/ (app route + "/")  -> 301 to /strats
//   anything else               -> untouched; S3 has no such object, and the
//                                  distribution's error response serves
//                                  /404.html with a real 404 status
//
// The route lists mirror src/config/routeMeta.js; aws/cloudfront-site-router.test.mjs
// fails if they drift.

var EXACT = {
  '/pricing': 1, '/about': 1, '/strats': 1, '/match-prep': 1, '/loadouts': 1, '/operators': 1,
  '/operators/compare': 1, '/meta': 1, '/vod': 1, '/live': 1, '/download': 1, '/changelog': 1,
  '/press': 1, '/creator-demo': 1, '/tools/r6-tier-list': 1, '/beginner-guide': 1, '/terms': 1,
  '/privacy': 1, '/refund': 1, '/help': 1, '/start': 1, '/auth': 1, '/dashboard': 1, '/progress': 1,
  '/setups': 1, '/coach-connect': 1, '/account': 1, '/activate': 1, '/support': 1, '/tiktok': 1,
  '/activation': 1, '/desktop': 1, '/desktop-app': 1, '/sign-in': 1, '/signin': 1, '/login': 1,
  '/signup': 1, '/sign-up': 1, '/register': 1
}
// Each concrete path has its own shell; an unknown value is a 404.
var SHELL_PREFIXES = ['/strats/', '/match-prep/', '/operators/']
// Any value is valid, so they share the generic shell.
var APP_PREFIXES = ['/r/', '/admin/', '/support/cases/', '/help/', '/embed/match-prep/']
var APP_EXACT = { '/admin': 1 }
// Static directories that also answer without the trailing slash.
var STATIC_DIRS = {
  '/blog': 1, '/guides': 1, '/guides/operators': 1, '/guides/bans': 1, '/compare': 1, '/coaching': 1,
  '/climb': 1, '/tools': 1, '/countdown': 1, '/status': 1, '/booking': 1, '/author/aaron': 1
}
// Static trees whose pages may be asked for without ".html".
var HTML_TREES = ['/blog/', '/guides/', '/compare/']

function startsWithAny(uri, prefixes) {
  for (var i = 0; i < prefixes.length; i++) {
    if (uri.indexOf(prefixes[i]) === 0 && uri.length > prefixes[i].length) return true
  }
  return false
}

function isAppRoute(uri) {
  return EXACT[uri] === 1 || APP_EXACT[uri] === 1 || startsWithAny(uri, SHELL_PREFIXES) || startsWithAny(uri, APP_PREFIXES)
}

function queryString(request) {
  var qs = request.querystring || {}
  var parts = []
  for (var key in qs) {
    var entry = qs[key]
    if (entry.multiValue) {
      for (var i = 0; i < entry.multiValue.length; i++) parts.push(key + '=' + entry.multiValue[i].value)
    } else {
      parts.push(entry.value === '' ? key : key + '=' + entry.value)
    }
  }
  return parts.length ? '?' + parts.join('&') : ''
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location }, 'cache-control': { value: 'public, max-age=3600' } }
  }
}

function route(request) {
  var uri = request.uri
  if (uri === '/' || uri === '') return request

  if (uri.charAt(uri.length - 1) === '/') {
    var bare = uri.slice(0, -1)
    if (isAppRoute(bare)) return redirect(bare + queryString(request))
    request.uri = uri + 'index.html'
    return request
  }

  var last = uri.substring(uri.lastIndexOf('/') + 1)
  if (last.indexOf('.') !== -1) return request

  if (STATIC_DIRS[uri] === 1) return redirect(uri + '/' + queryString(request))
  if (EXACT[uri] === 1 || startsWithAny(uri, SHELL_PREFIXES)) {
    request.uri = '/_shell' + uri + '.html'
    return request
  }
  if (APP_EXACT[uri] === 1 || startsWithAny(uri, APP_PREFIXES)) {
    request.uri = '/_shell/app.html'
    return request
  }
  if (startsWithAny(uri, HTML_TREES)) {
    request.uri = uri + '.html'
    return request
  }
  return request
}

function handler(event) {
  return route(event.request)
}
