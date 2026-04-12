import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Leaf } from "lucide-react";

export default function Privacy() {
  const lastUpdated = "April 12, 2026";

  return (
    <div className="min-h-screen bg-background text-primary w-full p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/50">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-primary/60 hover:text-secondary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xl font-serif text-primary mb-4">
            <Leaf className="w-5 h-5 text-secondary" />
            ZenSpace
          </div>
          <h1 className="text-4xl font-serif mb-4">Privacy Policy</h1>
          <p className="text-primary/60">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-primary/80 leading-relaxed">
          <p>
            Your privacy and peace of mind are our top priorities at ZenSpace. This Privacy Policy explains what information
            we collect, how we use it, and what rights you have. By using ZenSpace, you agree to the practices described here.
          </p>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">1. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <strong className="text-primary">Local Device Data</strong>
                <p>Most of your data — including journal entries, mood logs, habit records, expense notes, and tool outputs — is stored strictly on your device. We do not transmit this data to our servers.</p>
              </div>
              <div>
                <strong className="text-primary">Account Information</strong>
                <p>If you sign in using your phone number (OTP login), we collect and verify your phone number to identify your account. We do not store your OTP codes.</p>
              </div>
              <div>
                <strong className="text-primary">Subscription & Purchase Information</strong>
                <p>When you subscribe, your payment is processed by Google Play. We receive confirmation of subscription status (active/expired) but never receive your payment card details.</p>
              </div>
              <div>
                <strong className="text-primary">Usage Data</strong>
                <p>We may collect anonymized, aggregated usage statistics (e.g., feature usage frequency, crash logs, OS version) to improve the app. This data cannot identify you personally.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">2. Device Permissions</h2>
            <p className="mb-4">ZenSpace requests the following device permissions. Each is used only for its stated purpose and is never shared with third parties for advertising.</p>
            <div className="space-y-4">
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Camera</strong>
                <p className="mt-1">Used by the QR Code Scanner tool to read QR codes through your camera. The camera feed is processed entirely on-device and is never transmitted or stored.</p>
              </div>
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Microphone (Record Audio)</strong>
                <p className="mt-1">Used by the AI Talk Mode feature (voice chat with AI), the Voice Recorder tool, and the Speech-to-Text tool. Audio is processed to generate transcriptions or AI responses. Audio recordings from the Voice Recorder are saved locally on your device only.</p>
              </div>
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Storage (Photos, Media & Files)</strong>
                <p className="mt-1">Used to save images, audio recordings, and documents created within ZenSpace to your device's local storage. Also used to let you import images or files into applicable tools (e.g., Image Compressor, Document tools). We do not upload your files to any server.</p>
              </div>
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Notifications</strong>
                <p className="mt-1">Used to send optional reminders for habits, mindfulness sessions, and scheduled tools. You can disable notifications at any time from your device settings.</p>
              </div>
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Internet Access</strong>
                <p className="mt-1">Required for AI Chat features, OTP login verification, subscription management, and fetching real-time data for tools such as Currency Converter and Weather (where applicable).</p>
              </div>
              <div className="bg-secondary/5 rounded-2xl p-4 border border-border/30">
                <strong className="text-primary">Vibration</strong>
                <p className="mt-1">Used for haptic feedback to improve the interactive experience of timers and buttons. No data is collected through this permission.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">3. AI Chat & Talk Mode</h2>
            <p>
              When you use the AI Chat or AI Talk Mode features, your text or voice input is sent securely to our AI provider's servers to generate a response. Your inputs are not stored beyond the current session and are not used to train AI models. Voice inputs are converted to text before being sent; no raw audio is transmitted to AI servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">4. Third-Party Services</h2>
            <div className="space-y-3">
              <div>
                <strong className="text-primary">Google Play Billing</strong>
                <p>Manages in-app subscription purchases. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary underline">Google's Privacy Policy</a>.</p>
              </div>
              <div>
                <strong className="text-primary">Razorpay (where applicable)</strong>
                <p>Used for payment processing in select regions. Subject to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-secondary underline">Razorpay's Privacy Policy</a>.</p>
              </div>
              <div>
                <strong className="text-primary">Google AdMob</strong>
                <p>Free-tier users may see contextual ads served by Google AdMob. AdMob may collect device identifiers and usage data to serve relevant ads. You can opt out of personalised ads via your device's ad settings. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary underline">Google's Privacy Policy</a>.</p>
              </div>
              <div>
                <strong className="text-primary">Crash & Analytics Services</strong>
                <p>We may use anonymized crash reporting and analytics to identify bugs and improve stability. These services collect non-identifiable technical information such as device model and OS version.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">5. Data Retention & Deletion</h2>
            <p>
              Data stored on your device is deleted when you uninstall the app or clear app data. If you have an account, you may request deletion of your account and associated data by contacting us at the email below. We will process your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">6. Children's Privacy</h2>
            <p>
              ZenSpace is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date above. Continued use of ZenSpace after changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-primary mb-3">8. Contact Us</h2>
            <p>
              If you have questions, concerns, or data deletion requests, please contact us:
            </p>
            <div className="mt-3 bg-secondary/5 rounded-2xl p-4 border border-border/30">
              <p><strong>Email:</strong> support@zenspace.app</p>
              <p><strong>App:</strong> ZenSpace — Daily Tools & AI</p>
              <p><strong>Package:</strong> com.zenspace.dailytools</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
