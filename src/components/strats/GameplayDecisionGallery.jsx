import { getGameplayVisuals } from '../../data/gameplay-visuals'
import './GameplayDecisionGallery.css'

export default function GameplayDecisionGallery({ mapId, siteId, side }) {
  const gallery = getGameplayVisuals(mapId, siteId, side)
  if (!gallery?.frames?.length) return null

  return (
    <section className="gameplay-decision-gallery" aria-labelledby="gameplay-decision-title">
      <div className="gameplay-decision-heading">
        <div>
          <span>LOOK AT THIS NEXT</span>
          <h3 id="gameplay-decision-title">{gallery.title}</h3>
        </div>
        <p>{gallery.note}</p>
      </div>

      <ol className="gameplay-decision-grid">
        {gallery.frames.map((frame, index) => (
          <li key={frame.src}>
            <figure>
              <div className="gameplay-decision-image">
                <img src={frame.src} alt={frame.alt} loading="lazy" />
                <b>{index + 1}</b>
                <span>{frame.label}</span>
              </div>
              <figcaption>{frame.copy}</figcaption>
            </figure>
          </li>
        ))}
      </ol>

      <small>{gallery.source}</small>
    </section>
  )
}
