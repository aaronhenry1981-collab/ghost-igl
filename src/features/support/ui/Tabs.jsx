import { useId, useRef } from 'react'
import { tabKeyIndex } from '../supportLogic.mjs'

// Accessible tablist: roving tabindex, arrows/Home/End move and select,
// each tab controls `${idBase}-panel`. Consumers render the panel with
// <TabPanel idBase={...} />.
export function Tabs({ tabs, value, onChange, label, idBase, className = '', renderTab }) {
  const refs = useRef([])
  const fallback = useId()
  const base = idBase || fallback
  const current = Math.max(0, tabs.findIndex((t) => t.id === value))

  function onKeyDown(e) {
    const next = tabKeyIndex(current, e.key, tabs.length)
    if (next === current) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {tabs.map((t, i) => {
        const selected = i === current
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`${base}-panel`}
            tabIndex={selected ? 0 : -1}
            className={`sp-tab${selected ? ' is-active' : ''}${t.tone ? ` sp-tab-${t.tone}` : ''}`}
            onClick={() => onChange(t.id)}
          >
            {renderTab ? renderTab(t, selected) : t.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ idBase, activeId, children, className = '' }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${activeId}`} tabIndex={0} className={className}>
      {children}
    </div>
  )
}
