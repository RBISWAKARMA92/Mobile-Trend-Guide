import { motion } from "framer-motion";
import { Wifi, AlertTriangle } from "lucide-react";

export default function Preview() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-3">
          <div className="text-5xl mb-2">📱</div>
          <h1 className="text-3xl font-serif text-primary">Preview ZenSpace</h1>
          <p className="text-primary/70 text-sm leading-relaxed">
            Use the <strong>Expo Go app</strong> on your Android phone — not a browser — to preview the app live.
          </p>
        </div>

        {/* Warning box */}
        <div className="flex items-start gap-3 text-left bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600">Do not open the link in Chrome/Browser</p>
            <p className="text-xs text-amber-600/80 mt-1">
              The <code className="bg-amber-500/10 px-1 rounded">exp://</code> link is an app-only link. It will show "site can't be reached" in any browser. It only works inside the Expo Go app.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md border border-border/40 inline-block mx-auto">
          <img
            src="/expo-qr.png"
            alt="Expo QR Code"
            className="w-64 h-64 mx-auto"
            data-testid="expo-qr-image"
          />
          <p className="text-xs text-primary/40 mt-3">Scan with Expo Go → not your camera app</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <span className="text-xl mt-0.5">1️⃣</span>
            <div>
              <p className="text-sm font-semibold text-primary">Install Expo Go on your phone</p>
              <a
                href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-secondary underline"
              >
                Download from Google Play →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <span className="text-xl mt-0.5">2️⃣</span>
            <div>
              <p className="text-sm font-semibold text-primary">Open Expo Go → tap "Scan QR Code"</p>
              <p className="text-xs text-primary/60">Point your phone camera at the QR code above</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <span className="text-xl mt-0.5">3️⃣</span>
            <div>
              <p className="text-sm font-semibold text-primary">Or enter the URL manually inside Expo Go</p>
              <p className="text-xs text-primary/60 mb-1">
                Tap <strong>"Enter URL manually"</strong> in the Expo Go app and paste:
              </p>
              <code className="text-[10px] bg-muted px-2 py-1 rounded block break-all text-primary/70 text-left">
                exp://79b6c394-6b34-420d-8959-924615e0f36e-00-ymnvixgsbir1.expo.kirk.replit.dev
              </code>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <Wifi className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">No same-WiFi needed</p>
              <p className="text-xs text-primary/60">Works over any internet connection — 4G, 5G, or WiFi</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-primary/40">
          This is a development preview. The final app will be published on Google Play.
        </p>
      </motion.div>
    </div>
  );
}
