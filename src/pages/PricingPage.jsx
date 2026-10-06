import { Link } from 'react-router-dom'
import PricingSection from '../components/PricingSection'
import { FREE_MAP_NAMES, PLAN_FACTS } from '../config/planFacts'

// /pricing: the same plans as the home page's #pricing section, as a page of
// its own (title "Recon 6 Pricing — …" from config/routeMeta.js).
export default function PricingPage() {
  const { pro } = PLAN_FACTS
  return (
    <div className="pricing-page">
      <header className="section-header pricing-page-header">
        <div className="section-label">Plans</div>
        <h1>Recon 6 plans and pricing</h1>
        <p>
          Basic is free and opens {FREE_MAP_NAMES}. Pro is ${pro.monthlyUsd}/month for advanced strategies,
          {' '}{pro.aiReviewsPerMonth} AI VOD reviews a month and the desktop coach. Every plan, side by side, is below.
        </p>
        <p className="pricing-page-links">
          <Link to="/strats/bank/ceo/defense">Try the free Bank defense first</Link>
          {' · '}
          <a href="/coaching/index.html">1-on-1 coaching sessions</a>
          {' · '}
          <Link to="/refund">Refund policy</Link>
        </p>
      </header>
      <PricingSection />
    </div>
  )
}
