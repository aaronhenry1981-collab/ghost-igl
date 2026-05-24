// CloudFront Function — directory index resolution.
//
// Problem this solves: S3 with REST API origin doesn't auto-serve
// index.html for directory URLs. Requests like /blog/ would 404 from
// S3, then CloudFront's SPA-fallback custom error response would serve
// the React index.html — meaning every static directory page (/blog/,
// /tools/, /games/, /guides/) was being eaten by the SPA fallback and
// rendering the landing page.
//
// Fix: rewrite any request URI ending in '/' to append 'index.html'.
// That makes /blog/ → /blog/index.html (static blog index renders).
// Bare SPA routes like /dashboard still pass through unchanged → S3
// 404 → SPA fallback fires → React handles the route. Both work.

function handler(event) {
  var request = event.request
  var uri = request.uri

  // Directory request — append index.html so S3 can serve the
  // static page that exists at that path.
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html'
  }

  return request
}
