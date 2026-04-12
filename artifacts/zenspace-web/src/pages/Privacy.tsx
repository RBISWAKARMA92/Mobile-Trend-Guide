import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Leaf } from "lucide-react";

export default function Privacy() {
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
          <p className="text-primary/60">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-stone dark:prose-invert max-w-none text-primary/80">
          <p>
            Your privacy and peace of mind are our top priorities at ZenSpace. This policy outlines how we handle your data with respect and care.
          </p>

          <h3 className="text-xl font-serif text-primary mt-8 mb-4">1. Information We Collect</h3>
          <p>
            <strong>Local Data:</strong> Most of your data, including journal entries, mood logs, habits, and expenses, are stored strictly locally on your device. We do not transmit this data to our servers unless you explicitly enable cloud backup.
          </p>
          <p>
            <strong>Account Information:</strong> If you create an account or subscribe, we collect basic information such as your email address and subscription status.
          </p>

          <h3 className="text-xl font-serif text-primary mt-8 mb-4">2. AI Chat Features</h3>
          <p>
            When you use the AI Talk Mode or text chat, your inputs are sent to our secure AI providers to generate responses. These interactions are anonymized and are not used to train public AI models. We do not store your conversation history on our servers beyond what is necessary to maintain the context of your current session.
          </p>

          <h3 className="text-xl font-serif text-primary mt-8 mb-4">3. Subscriptions & Payments</h3>
          <p>
            Payments for Monthly, Quarterly, and Yearly plans are processed securely through Google Play. We do not have access to your full credit card information.
          </p>

          <h3 className="text-xl font-serif text-primary mt-8 mb-4">4. Third-Party Services</h3>
          <p>
            We use trusted third-party services (such as secure analytics and crash reporting) to improve the app. These services collect anonymized usage data and device information (e.g., OS version) to help us fix bugs and improve performance.
          </p>

          <h3 className="text-xl font-serif text-primary mt-8 mb-4">5. Contact Us</h3>
          <p>
            If you have any questions about your privacy, please contact us at support@zenspace.app. We are here to help.
          </p>
        </div>
      </div>
    </div>
  );
}
