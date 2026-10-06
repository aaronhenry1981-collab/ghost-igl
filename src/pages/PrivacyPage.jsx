export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: October 2026</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly:</p>
      <ul>
        <li><strong>Account information:</strong> Email address when you subscribe</li>
        <li><strong>Payment information:</strong> Processed securely through Stripe. We do not store credit card numbers</li>
        <li><strong>Uploaded content:</strong> Screenshots you submit for VOD analysis</li>
        <li><strong>Usage data:</strong> Pages visited, features used, clicks, and session activity collected through Plausible and HeyCatch analytics</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and improve the Service</li>
        <li>To process payments and manage subscriptions</li>
        <li>To analyze uploaded screenshots for coaching feedback</li>
        <li>To send service-related communications (billing, updates)</li>
        <li>To send marketing emails (only with your consent, unsubscribe anytime)</li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored securely using industry-standard encryption. Uploaded screenshots are sent for analysis and are not stored: we keep no copy of the images. The written result of each AI review (the notes you typed and the analysis, no images) is kept under a hashed identifier instead of your email so we can improve coaching quality. We do not sell your data to third parties.</p>

      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>)</li>
        <li><strong>Plausible Analytics:</strong> Privacy-friendly, cookie-free website analytics</li>
        <li><strong>HeyCatch:</strong> Product analytics used to understand anonymous site journeys and improve signup and product flows. Recon 6 does not send HeyCatch account names or email addresses.</li>
        <li><strong>AI Analysis:</strong> Screenshots may be processed by AI services for coaching feedback</li>
      </ul>

      <h2>5. Cookies</h2>
      <p>Recon 6 uses minimal cookies for essential functionality such as session management and authentication. Plausible does not use cookies. HeyCatch may use browser storage and session identifiers to measure activity on Recon 6, but we do not configure it to receive account names or email addresses.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request deletion of your account and data</li>
        <li>Unsubscribe from marketing communications</li>
        <li>Export your data</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>Account data is retained while your account is active. Upon deletion, personal data is removed within 30 days, including your written AI review results, support history, progress and coaching records. Booked coaching times stay on our schedule with your details removed. Payment records are held by Stripe. Anonymized usage statistics may be retained for service improvement.</p>

      <h2>8. Children's Privacy</h2>
      <p>The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this policy periodically. Changes will be posted on this page with an updated date. Continued use of the Service constitutes acceptance.</p>

      <h2>10. Contact</h2>
      <p>For privacy-related inquiries, including requests to access, export or delete your data, email <strong>support@r6coaching.com</strong> from your account email with "Privacy request" in the subject.</p>
    </div>
  )
}
