import { communityProof, founderProof, reviewProof } from '../config/publicProof'
import { track } from '../utils/analytics'
import './PublicProof.css'

export function CommunityProof() {
  const proof = communityProof()
  if (!proof) return null
  return <div className="community-proof">
    <p><strong>{proof.count.toLocaleString('en-US')}</strong> {proof.label} <small>As of {proof.verifiedOn}</small></p>
    {proof.members.length > 0 && <div className="community-faces" aria-label="Members pictured with permission">
      {proof.members.map(member => <img key={member.image} src={member.image} alt={member.name} width="40" height="40" loading="lazy" />)}
    </div>}
  </div>
}

export function FounderProof({ linkOnly = false }) {
  const proof = founderProof()
  if (!proof) return null
  const link = <a href={proof.profileUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('Founder Profile Click', { location: linkOnly ? 'footer' : 'about' })}>{proof.profileLabel}</a>
  return linkOnly ? link : <figure className="founder-proof"><img src={proof.image} alt={proof.name} width="160" height="160" loading="lazy" /><figcaption>{link}</figcaption></figure>
}

export function ReviewProof({ linkOnly = false }) {
  const proof = reviewProof()
  if (!proof) return null
  const link = <a href={proof.url} target="_blank" rel="noopener noreferrer" onClick={() => track('Independent Review Click', { location: linkOnly ? 'footer' : 'home' })}>{proof.title}</a>
  return linkOnly ? link : <aside className="independent-proof" aria-label="Independent review">{link}<p>Published <time dateTime={proof.publishedOn}>{proof.publishedOn}</time></p></aside>
}
