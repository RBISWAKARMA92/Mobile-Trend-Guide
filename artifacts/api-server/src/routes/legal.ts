import { Router } from "express";

const router = Router();

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZenSpace – Privacy Policy</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f0d1a;
      color: #e2e0f0;
      min-height: 100vh;
      padding: 0 16px 64px;
    }
    .hero {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 0 32px;
      border-bottom: 1px solid #2d2a3d;
    }
    .logo { font-size: 36px; margin-bottom: 12px; }
    h1 { font-size: 28px; font-weight: 800; color: #a78bfa; margin-bottom: 8px; }
    .subtitle { font-size: 15px; color: #9d8ec0; line-height: 1.6; }
    .updated { margin-top: 8px; font-size: 12px; color: #6b5e8c; }
    main { max-width: 760px; margin: 32px auto 0; display: flex; flex-direction: column; gap: 24px; }
    .card {
      background: #1a1728;
      border: 1px solid #2d2a3d;
      border-radius: 16px;
      padding: 24px;
    }
    h2 { font-size: 16px; font-weight: 700; color: #c4b5fd; margin-bottom: 14px; }
    ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.65; color: #b8aed4; }
    li::before { content: "•"; color: #7c3aed; font-size: 18px; line-height: 1.3; flex-shrink: 0; }
    strong { color: #e2e0f0; font-weight: 600; }
    a { color: #a78bfa; text-decoration: none; }
    footer {
      max-width: 760px; margin: 40px auto 0;
      font-size: 12px; color: #6b5e8c; text-align: center;
    }
    @media (max-width: 480px) { h1 { font-size: 22px; } .card { padding: 16px; } }
  </style>
</head>
<body>
  <div class="hero">
    <div class="logo">🧘</div>
    <h1>Privacy Policy</h1>
    <p class="subtitle">Your privacy matters to us. This policy explains what information ZenSpace collects, how we use it, and your rights.</p>
    <p class="updated">Last updated: April 12, 2026</p>
  </div>

  <main>
    <div class="card">
      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Phone Number</strong> — collected only when you choose to log in via OTP. Used solely for authentication.</li>
        <li><strong>AI Chat Messages</strong> — sent to our server to generate AI replies. We do not permanently store conversation history beyond your active session.</li>
        <li><strong>Expense &amp; Budget Data</strong> — stored locally on your device only. We never upload your financial data to our servers.</li>
        <li><strong>Subscription &amp; Payment Info</strong> — handled entirely by Razorpay. We only receive a payment status confirmation and never see your card, UPI, or banking details.</li>
        <li><strong>Usage Analytics</strong> — anonymised data (which tools you open) used to improve the app.</li>
        <li><strong>Ad Interactions</strong> — Google AdMob collects data for ad personalisation as per Google's privacy policy.</li>
      </ul>
    </div>

    <div class="card">
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To authenticate your account and keep it secure.</li>
        <li>To power the AI chat feature by forwarding your messages to our AI provider (Google Gemini / OpenAI).</li>
        <li>To track your credit balance and subscription status.</li>
        <li>To serve relevant ads through Google AdMob. You may opt out of personalised ads in your device settings.</li>
        <li>To show streak reminders and in-app notifications. No marketing emails without explicit consent.</li>
      </ul>
    </div>

    <div class="card">
      <h2>3. Third-Party Services</h2>
      <ul>
        <li><strong>Razorpay</strong> — processes all payments. Subject to <a href="https://razorpay.com/privacy/" target="_blank">Razorpay's Privacy Policy</a>.</li>
        <li><strong>Google AdMob</strong> — serves ads. Subject to <a href="https://policies.google.com/privacy" target="_blank">Google's Privacy Policy</a>.</li>
        <li><strong>Google Gemini / OpenAI</strong> — powers AI chat. Your messages are sent to their APIs under their respective privacy policies.</li>
        <li><strong>Expo / React Native</strong> — the app framework. No personal data is shared with Expo beyond standard crash reporting.</li>
      </ul>
    </div>

    <div class="card">
      <h2>4. Data Storage &amp; Security</h2>
      <ul>
        <li>Account data (phone number, credit balance, subscription) is stored on secure servers with a PostgreSQL database.</li>
        <li>All API communication is encrypted over HTTPS.</li>
        <li>Payment webhooks are verified using HMAC-SHA256 signatures.</li>
        <li>Expense data, language preferences, streak counts, and onboarding state are stored only on your device.</li>
      </ul>
    </div>

    <div class="card">
      <h2>5. Data Retention</h2>
      <ul>
        <li>Your account data is retained for as long as your account is active.</li>
        <li>You may request deletion of your account and all associated data by contacting us at <a href="mailto:support@zenspace.app">support@zenspace.app</a>.</li>
        <li>Anonymous analytics data may be retained in aggregate form even after account deletion.</li>
      </ul>
    </div>

    <div class="card">
      <h2>6. Children's Privacy</h2>
      <ul>
        <li>ZenSpace is not intended for children under 13 years of age.</li>
        <li>We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</li>
      </ul>
    </div>

    <div class="card">
      <h2>7. Your Rights</h2>
      <ul>
        <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
        <li><strong>Correction</strong> — ask us to correct inaccurate data.</li>
        <li><strong>Deletion</strong> — ask us to delete your account and personal data.</li>
        <li><strong>Opt-out of personalised ads</strong> — via your device's ad settings (Android: Settings → Google → Ads).</li>
        <li>To exercise any of these rights, email <a href="mailto:support@zenspace.app">support@zenspace.app</a>.</li>
      </ul>
    </div>

    <div class="card">
      <h2>8. Changes to This Policy</h2>
      <ul>
        <li>We may update this Privacy Policy from time to time. Significant changes will be communicated through the app.</li>
        <li>Continued use of ZenSpace after changes constitutes acceptance of the updated policy.</li>
      </ul>
    </div>

    <div class="card">
      <h2>9. Contact Us</h2>
      <ul>
        <li>If you have questions or concerns about this Privacy Policy, contact us at <a href="mailto:support@zenspace.app">support@zenspace.app</a>.</li>
      </ul>
    </div>
  </main>

  <footer>
    &copy; 2026 ZenSpace. All rights reserved.
  </footer>
</body>
</html>`;

router.get("/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(PRIVACY_HTML);
});

export default router;
