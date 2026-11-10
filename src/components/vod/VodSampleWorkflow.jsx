import { R6_DEMO_ANALYSIS } from '../../data/vodDemoR6'

export default function VodSampleWorkflow() {
  return (
    <section className="vod-section" aria-labelledby="vod-sample-workflow-title">
      <h2 id="vod-sample-workflow-title">{R6_DEMO_ANALYSIS.title}</h2>
      <p>{R6_DEMO_ANALYSIS.description}</p>
      <ol className="review-sample-steps">
        {R6_DEMO_ANALYSIS.steps.map(step => (
          <li key={step.label}>
            <strong>{step.label}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
