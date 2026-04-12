export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly:</p>
      <ul>
        <li><strong>Account information:</strong> Email address when you subscribe</li>
        <li><strong>Payment information:</strong> Processed securely through Stripe. We do not store credit card numbers</li>
        <li><strong>Uploaded content:</strong> Screenshots or videos you submit for VOD analysis</li>
        <li><strong>Usage data:</strong> Pages visited, features used, collected via privacy-friendly analytics (Plausible)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and improve the Service</li>
        <li>To process payments and manage subscriptions</li>
        <li>To analyze uploaded screenshots/videos for coaching feedback</li>
        <li>To send service-related communications (billing, updates)</li>
        <li>To send marketing emails (only with your consent, unsubscribe anytime)</li>
      </ul>

      <h2>3. Data Storage &amp; Security</h2>
      <p>Your data is stored securely using industry-standard encryption. Uploaded screenshots are processed for analysis and deleted within 30 days. We do not sell your data to third parties.</p>

      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>)</li>
        <li><strong>Plausible Analytics:</strong> Privacy-friendly, cookie-free website analytics</li>
        <li><strong>AI Analysis:</strong> Screenshots may be processed by AI services for coaching feedback</li>
      </ul>

      <h2>5. Cookies</h2>
      <p>Ghost IGL uses minimal cookies for essential functionality only (session management, authentication). We use Plausible Analytics which does not use cookies and does not track users across sites.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request deletion of your account and data</li>
        <li>Unsubscribe from marketing communications</li>
        <li>Export your data</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>Account data is retained while your account is active. Upon deletion, personal data is removed within 30 days. Anonymized usage statistics may be retained for service improvement.</p>

      <h2>8. Children's Privacy</h2>
      <p>The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this policy periodically. Changes will be posted on this page with an updated date. Continued use of the Service constitutes acceptance.</p>

      <h2>10. Contact</h2>
      <p>For privacy-related inquiries, contact us at <strong>privacy@r6coaching.com</strong>.</p>
    </div>
  )
}
