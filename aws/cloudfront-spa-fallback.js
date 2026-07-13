// CloudFront Function (viewer-request) — SPA fallback for BrowserRouter.
//
// After the HashRouter→BrowserRouter migration, real paths like /strats or
// /operators/ash have no matching S3 object. This rewrites extensionless,
// non-directory requests to /index.html (HTTP 200) so the SPA boots and React
// Router renders the route — instead of S3 returning a 404. Real files
// (*.css, *.js, *.png, sitemap.xml) and directory paths ending in "/" (which
// S3 serves as their index.html — including the static /coaching/, /climb/,
// /blog/<slug>/ pages) pass through untouched, so their real HTML is served.
//
// ⚠️ NOT YET DEPLOYED. Apply at the supervised cutover:
//   1. aws cloudfront create-function --name recon6-spa-fallback \
//        --function-config Comment="SPA fallback",Runtime=cloudfront-js-2.0 \
//        --function-code fileb://aws/cloudfront-spa-fallback.js
//   2. publish-function, then associate as a viewer-request function on the
//      default cache behavior of distribution E2WUR8DDHCOYC9.
//   3. Verify: direct-visit /strats (SPA loads), /coaching/ (static page),
//      /assets/*.js (asset) — none 404. Keep genuine 404s returning 404.
//
// PRERENDER NOTE (the piece that needs a decision before this is "SEO-complete"):
// this function serves the SPA shell for extensionless routes. To serve
// prerendered HTML for e.g. /strats, either (a) prerender to /strats/index.html
// and link with a trailing slash so it hits the directory path, or (b) extend
// this function to map /strats -> /strats/index.html when a prerendered file
// exists. That interaction is the supervised call — see the SEO command.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) return request;            // directory index → S3 serves .../index.html
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') !== -1) return request; // has a file extension → real asset
  request.uri = '/index.html';                       // extensionless SPA route → shell
  return request;
}
