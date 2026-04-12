import { motion } from "framer-motion";
import { Smartphone, Wifi } from "lucide-react";

export default function Preview() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
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
            Scan this QR code with <strong>Expo Go</strong> on your Android phone to preview the app live.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md border border-border/40 inline-block mx-auto">
          <img
            src="/expo-qr.png"
            alt="Expo QR Code"
            className="w-64 h-64 mx-auto"
            data-testid="expo-qr-image"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <span className="text-xl mt-0.5">1️⃣</span>
            <div>
              <p className="text-sm font-semibold text-primary">Install Expo Go</p>
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
              <p className="text-sm font-semibold text-primary">Scan the QR code above</p>
              <p className="text-xs text-primary/60">Open Expo Go → tap "Scan QR Code"</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-secondary/5 rounded-xl p-4">
            <Wifi className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">No same-WiFi needed</p>
              <p className="text-xs text-primary/60">Works over any internet connection</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-primary/40">
          Or open Expo Go → Enter URL manually:
          <br />
          <code className="text-primary/60 text-[10px] break-all">
            exp://79b6c394-6b34-420d-8959-924615e0f36e-00-ymnvixgsbir1.expo.kirk.replit.dev
          </code>
        </p>
      </motion.div>
    </div>
  );
}
