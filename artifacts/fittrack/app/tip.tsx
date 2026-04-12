import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { trackToolOpen } from "@/components/InterstitialAdManager";
import { useLanguage } from "@/context/LanguageContext";

const TIP_PRESETS = [5, 10, 15, 18, 20, 25];

const CURRENCIES = [
  { symbol: "₹", code: "INR", label: "Indian Rupee" },
  { symbol: "$", code: "USD", label: "US Dollar" },
  { symbol: "€", code: "EUR", label: "Euro" },
  { symbol: "£", code: "GBP", label: "British Pound" },
  { symbol: "¥", code: "JPY", label: "Japanese Yen" },
  { symbol: "AED", code: "AED", label: "UAE Dirham" },
];

export default function TipScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [bill, setBill] = useState("");
  const [tip, setTip] = useState(10);
  const [people, setPeople] = useState("2");
  const [currencyIdx, setCurrencyIdx] = useState(0);

  const { symbol } = CURRENCIES[currencyIdx];
  const billVal = parseFloat(bill) || 0;
  const pplVal = Math.max(1, parseInt(people) || 1);
  const tipAmount = billVal * (tip / 100);
  const total = billVal + tipAmount;
  const perPerson = total / pplVal;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Currency selector */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyRow}>
          {CURRENCIES.map((c, i) => (
            <Pressable
              key={c.code}
              onPress={() => setCurrencyIdx(i)}
              style={[
                styles.currencyBtn,
                { backgroundColor: currencyIdx === i ? colors.primary : colors.muted, borderColor: currencyIdx === i ? colors.primary : "transparent" },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: currencyIdx === i ? "#fff" : colors.foreground }]}>{c.symbol}</Text>
              <Text style={[styles.currencyCode, { color: currencyIdx === i ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{c.code}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.bill} ({symbol})</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          keyboardType="numeric"
          value={bill}
          onChangeText={setBill}
          placeholder="0.00"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.tipPercent}</Text>
        <View style={styles.presets}>
          {TIP_PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setTip(p)}
              style={[
                styles.preset,
                {
                  backgroundColor: tip === p ? colors.primary : colors.muted,
                  borderColor: tip === p ? colors.primary : "transparent",
                },
              ]}
            >
              <Text style={[styles.presetTxt, { color: tip === p ? "#fff" : colors.foreground }]}>
                {p}%
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.tipNote, { color: colors.mutedForeground }]}>
          Tip: {symbol}{tipAmount.toFixed(2)} ({tip}% of bill)
        </Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.people}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setPeople(String(Math.max(1, pplVal - 1)))}
            style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.stepTxt, { color: colors.foreground }]}>−</Text>
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.stepVal, { color: colors.foreground }]}>{pplVal}</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              {pplVal === 1 ? "person" : "people"}
            </Text>
          </View>
          <Pressable
            onPress={() => setPeople(String(pplVal + 1))}
            style={[styles.stepBtn, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.stepTxt, { color: colors.foreground }]}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.results, { backgroundColor: colors.primary }]}>
        <Row label="Tip Amount" value={`${symbol}${tipAmount.toFixed(2)}`} light />
        <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <Row label={t.total} value={`${symbol}${total.toFixed(2)}`} light />
        <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <Row label={t.perPerson} value={`${symbol}${perPerson.toFixed(2)}`} light big />
      </View>

      {billVal > 0 && pplVal > 1 && (
        <View style={[styles.splitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.splitTitle, { color: colors.foreground }]}>💳 Split Summary</Text>
          <Text style={[styles.splitText, { color: colors.mutedForeground }]}>
            Each of the {pplVal} people pays <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>{symbol}{perPerson.toFixed(2)}</Text>
          </Text>
          <Text style={[styles.splitText, { color: colors.mutedForeground }]}>
            That includes <Text style={{ color: colors.foreground }}>{symbol}{(billVal / pplVal).toFixed(2)}</Text> bill + <Text style={{ color: colors.foreground }}>{symbol}{(tipAmount / pplVal).toFixed(2)}</Text> tip
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, light, big }: { label: string; value: string; light?: boolean; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: light ? "rgba(255,255,255,0.8)" : "#0f172a" }]}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.bigValue, { color: light ? "#fff" : "#0f172a" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  currencyRow: { gap: 8 },
  currencyBtn: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, minWidth: 56 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold" },
  currencyCode: { fontSize: 10, fontFamily: "Inter_400Regular" },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 24, fontFamily: "Inter_600SemiBold",
  },
  presets: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  presetTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tipNote: { fontSize: 13, fontFamily: "Inter_400Regular" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stepTxt: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  stepVal: { fontSize: 28, fontFamily: "Inter_700Bold", minWidth: 40, textAlign: "center" },
  stepSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  results: { borderRadius: 20, padding: 24, gap: 12 },
  divider: { height: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  rowValue: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  bigValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  splitCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  splitTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  splitText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
