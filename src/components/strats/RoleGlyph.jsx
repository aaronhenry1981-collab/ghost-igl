function glyphFor(role = '') {
  const key = role.toLowerCase()

  if (/intel|camera|drone|scan|tracker/.test(key)) {
    return (
      <>
        <path d="M4.5 12s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
        <circle cx="12" cy="12" r="2.4" />
      </>
    )
  }
  if (/breach|wall|denial|anchor|shield/.test(key)) {
    return (
      <>
        <path d="M6 5.5h12v13H6z" />
        <path d="M12 5.5v13M6 11.8h12" />
      </>
    )
  }
  if (/entry|frag|gunner|duelist/.test(key)) {
    return (
      <>
        <circle cx="12" cy="12" r="5.5" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      </>
    )
  }
  if (/roam|flank|lurker/.test(key)) {
    return (
      <>
        <path d="M5 17c2.2-6.6 5.8-9.9 12-10" />
        <path d="m13.7 4.5 3.8 2.4-2.4 3.8" />
      </>
    )
  }
  if (/trap|area|control|crowd/.test(key)) {
    return (
      <>
        <path d="m12 4 8 15H4L12 4Z" />
        <path d="M12 9v4.5M12 16.4v.1" />
      </>
    )
  }
  if (/support|heal|flex/.test(key)) {
    return <path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5V4Z" />
  }
  return (
    <>
      <path d="M12 3.5 19 6v5.2c0 4.1-2.2 7.3-7 9.3-4.8-2-7-5.2-7-9.3V6l7-2.5Z" />
      <path d="m8.7 12 2.1 2.1 4.6-4.6" />
    </>
  )
}

export default function RoleGlyph({ role, name, className = '' }) {
  return (
    <span className={`role-glyph ${className}`.trim()} aria-hidden="true" title={`${name || 'Operator'} · ${role || 'team role'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {glyphFor(role)}
      </svg>
    </span>
  )
}
