import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const LAST_UPDATED = "April 12, 2026";
const APP_NAME = "ZenSpace";
const CONTACT_EMAIL = "support@zenspace.app";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "**Phone Number** — collected only when you choose to log in via OTP. Used solely for authentication.",
      "**AI Chat Messages** — your messages and the AI's responses are sent to our server to generate replies. We do not permanently store conversation history beyond your active session.",
      "**Expense & Budget Data** — stored locally on your device using secure storage. We do not upload your financial data to our servers.",
      "**Subscription & Payment Info** — handled entirely by Razorpay. We receive only a payment status confirmation; we never see or store your card, UPI, or banking details.",
      "**Usage Analytics** — anonymised data such as which tools you open and how often, used to improve the app.",
      "**Ad Interactions** — Google AdMob collects data for ad personalisation as described in Google's own privacy policy.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To authenticate your account and keep it secure.",
      "To power the AI chat feature by forwarding your messages to our AI provider (Google Gemini / OpenAI).",
      "To track your credit balance and subscription status.",
      "To serve relevant ads through Google AdMob (you may opt out of personalised ads in your device settings).",
      "To send streak reminders and in-app notifications (no marketing emails without consent).",
    ],
  },
  {
    title: "3. Third-Party Services",
    content: [
      "**Razorpay** — processes all payments. Subject to Razorpay's Privacy Policy (razorpay.com/privacy).",
      "**Google AdMob** — serves ads and measures performance. Subject to Google's Privacy Policy (policies.google.com/privacy).",
      "**Google Gemini / OpenAI** — powers the AI chat. Your messages are sent to their APIs. Subject to their respective privacy policies.",
      "**Expo / React Native** — the app framework. No personal data is shared with Expo beyond standard crash/analytics reporting.",
    ],
  },
  {
    title: "4. Data Storage & Security",
    content: [
      "Account data (phone number, credit balance, subscription) is stored on secure servers hosted on Replit with PostgreSQL.",
      "All API communication is encrypted over HTTPS.",
      "Payment webhooks are verified using HMAC-SHA256 signatures.",
      "Expense data, language preferences, streak counts, and onboarding state are stored only on your device.",
    ],
  },
  {
    title: "5. Data Retention",
    content: [
      "Your account data is retained for as long as your account is active.",
      "You may request deletion of your account and all associated data by contacting us at the email below.",
      "Anonymous analytics data may be retained in aggregate form even after account deletion.",
    ],
  },
  {
    title: "6. Children's Privacy",
    content: [
      "ZenSpace is not intended for children under 13 years of age. We do not knowingly collect personal information from children.",
      "If you believe a child has provided us with personal information, please contact us immediately.",
    ],
  },
  {
    title: "7. Your Rights",
    content: [
      "**Access** — request a copy of the data we hold about you.",
      "**Correction** — ask us to correct inaccurate data.",
      "**Deletion** — ask us to delete your account and personal data.",
      "**Opt-out of personalised ads** — via your device's ad settings (Android: Settings → Google → Ads).",
      "To exercise any of these rights, email us at " + CONTACT_EMAIL + ".",
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app.",
      "Continued use of ZenSpace after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "9. Contact Us",
    content: [
      "If you have any questions or concerns about this Privacy Policy, please contact us:",
      "📧 " + CONTACT_EMAIL,
    ],
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.appName, { color: colors.primary }]}>🧘 {APP_NAME}</Text>
          <Text style={[styles.introText, { color: colors.mutedForeground }]}>
            Your privacy matters to us. This policy explains what information we collect, how we use it, and your rights.
          </Text>
          <Text style={[styles.updated, { color: colors.mutedForeground }]}>Last updated: {LAST_UPDATED}</Text>
        </View>

        {/* Sections */}
        {sections.map((s, i) => (
          <View key={i} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            {s.content.map((line, j) => {
              const parts = line.split(/\*\*([^*]+)\*\*/g);
              return (
                <View key={j} style={styles.bullet}>
                  <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>
                    {parts.map((p, k) =>
                      k % 2 === 1
                        ? <Text key={k} style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>{p}</Text>
                        : p
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },
  introCard: {
    borderRadius: 16, padding: 18, borderWidth: 1, gap: 8,
  },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  introText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  updated: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  bullet: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletDot: { fontSize: 16, lineHeight: 22, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
});
