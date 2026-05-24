import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// In a HashRouter setup, <Link to="/#pricing"> does NOT scroll to the
// #pricing DOM anchor — it navigates to an unmatched route and the
// catch-all redirect sends you home without scrolling. Use this hook
// to produce a click handler that navigates to "/" and then scrolls
// to the given section id after the landing page mounts.
export function useSectionNavigate(sectionId, { offset = 60 } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'

  return useCallback(() => {
    function scrollNow() {
      const el = document.getElementById(sectionId)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    if (isLanding) {
      scrollNow()
    } else {
      navigate('/')
      setTimeout(scrollNow, 300)
    }
  }, [sectionId, isLanding, navigate, offset])
}
