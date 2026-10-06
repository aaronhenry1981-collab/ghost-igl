import { useEffect } from 'react'
import { metaForPath } from '../config/routeMeta.js'

// Keeps the document head in step with client-side navigation: the same
// title, description, canonical and robots rule the prerendered shell for
// that route carries (scripts/generate-route-shells.mjs). The admin area
// names its own tabs, so it is left alone.
function setAttr(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el && value != null) el.setAttribute(attr, value)
}

export function useRouteMeta(pathname) {
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/__dev')) return
    const meta = metaForPath(pathname)
    if (!meta) return
    const description = meta.description || metaForPath('/').description
    document.title = meta.title
    setAttr('meta[name="description"]', 'content', description)
    setAttr('meta[property="og:title"]', 'content', meta.title)
    setAttr('meta[property="og:description"]', 'content', description)
    setAttr('meta[property="og:url"]', 'content', meta.canonical)
    setAttr('meta[name="twitter:title"]', 'content', meta.title)
    setAttr('meta[name="twitter:description"]', 'content', description)
    setAttr('link[rel="canonical"]', 'href', meta.canonical)
    setAttr('meta[name="robots"]', 'content', meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large')
  }, [pathname])
}
