import { approvedTestimonials, testimonialPhoto } from '../config/publicProof'
// Testimonial cards, shared by the home page (#testimonials) and /pricing.
// Existing published quotes stay intact; photos require explicit public approval.
function initialsOf(name) {
  // "Splinter — creator" -> "S": drop the label after the dash first.
  const base = String(name || '').split(/\s+[—–-]\s+/)[0]
  return base.split(/\s+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
}

export default function TestimonialCards({ testimonials }) {
  const approved = approvedTestimonials()
  return (
    <div className="testimonials-grid">
      {testimonials.map((t) => (
        <div className="testimonial-card" key={t.id || t.name}>
          <p className="testimonial-text">{'“'}{t.text}{'”'}</p>
          <div className="testimonial-author">
            <div className="testimonial-avatar" aria-hidden="true">{(t.photo || testimonialPhoto(t) || approved.find(a => a.id === t.id)?.image)
              ? <img src={t.photo || testimonialPhoto(t) || approved.find(a => a.id === t.id).image} alt="" width="40" height="40" loading="lazy" />
              : initialsOf(t.name)}</div>
            <div className="testimonial-meta">
              <strong>{t.name}</strong>
              {t.rank && <span className="rank-up">{t.rank}</span>}
            </div>
          </div>
          {t.hours && <div className="testimonial-hours">{t.hours}</div>}
        </div>
      ))}
    </div>
  )
}
