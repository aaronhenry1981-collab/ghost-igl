import { useEffect } from 'react'

// Applies a fade-up reveal to common landing-page elements as they scroll in.
// Every targeted element gets the `.reveal` class + a per-element animation
// delay, then flips to `.reveal.in-view` via IntersectionObserver.
// Honors prefers-reduced-motion.
const DEFAULT_SELECTORS = [
  '.section-header',
  '.features-grid > *',
  '.steps-grid > *',
  '.compare-table-wrap',
  '.ranks-track',
  '.testimonials-grid > *',
  '.pricing-grid > *',
  '.faq-list > *',
  '.meta-strip',
  '.strat-preview-wrap',
  '.demo-video-wrap',
  '.pricing-reassure',
].join(', ')

export function useReveal({ selector = DEFAULT_SELECTORS, rootMargin = '0px 0px -8% 0px' } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const nodes = Array.from(document.querySelectorAll(selector))
    if (!nodes.length) return

    // Arm: add the base class + staggered delay by position within each grid.
    // Keeps things that are side-by-side from popping in one at a time with
    // big delays — we cap the stagger at 160ms per cluster.
    nodes.forEach((el) => {
      el.classList.add('reveal')
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : []
      const idx = Math.max(0, siblings.indexOf(el))
      const delay = Math.min(idx * 60, 240)
      el.style.setProperty('--reveal-delay', `${delay}ms`)
    })

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((el) => el.classList.add('in-view'))
      return
    }
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('in-view'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin, threshold: 0.05 },
    )

    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [selector, rootMargin])
}
