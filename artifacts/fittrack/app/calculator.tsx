import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { trackToolOpen } from "@/components/InterstitialAdManager";
import { useLanguage } from "@/context/LanguageContext";

const BUTTONS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

export default function CalculatorScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitingNext, setWaitingNext] = useState(false);

  function handlePress(btn: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (btn === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setWaitingNext(false);
    } else if (btn === "±") {
      setDisplay((d) => String(-parseFloat(d)));
    } else if (btn === "%") {
      setDisplay((d) => String(parseFloat(d) / 100));
    } else if (["÷", "×", "−", "+"].includes(btn)) {
      setPrev(display); setOp(btn); setWaitingNext(true);
    } else if (btn === "=") {
      if (prev !== null && op !== null) {
        const a = parseFloat(prev);
        const b = parseFloat(display);
        let res = 0;
        if (op === "÷") res = b !== 0 ? a / b : 0;
        else if (op === "×") res = a * b;
        else if (op === "−") res = a - b;
        else if (op === "+") res = a + b;
        const str = Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/, "");
        setDisplay(str);
        setPrev(null); setOp(null); setWaitingNext(false);
      }
    } else if (btn === "⌫") {
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
    } else if (btn === ".") {
      if (!display.includes(".")) setDisplay((d) => d + ".");
    } else {
      if (waitingNext) {
        setDisplay(btn); setWaitingNext(false);
      } else {
        setDisplay((d) => (d === "0" ? btn : d.length < 12 ? d + btn : d));
      }
    }
  }

  const isOp = (b: string) => ["÷", "×", "−", "+"].includes(b);
  const isSpecial = (b: string) => ["C", "±", "%"].includes(b);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: bottomPad + 12 }]}>
      <View style={[styles.displayArea, { backgroundColor: colors.card }]}>
        {op && <Text style={[styles.opIndicator, { color: colors.mutedForeground }]}>{prev} {op}</Text>}
        <Text
          style={[styles.displayText, { color: colors.foreground }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>
      <View style={styles.buttons}>
        {BUTTONS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((btn) => {
              const isEq = btn === "=";
              const isOpBtn = isOp(btn);
              const isSpc = isSpecial(btn);
              return (
                <Pressable
                  key={btn}
                  onPress={() => handlePress(btn)}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: isEq
                        ? colors.primary
                        : isOpBtn
                        ? `${colors.primary}22`
                        : isSpc
                        ? colors.muted
                        : colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                    btn === "0" && styles.zeroBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: isEq
                          ? "#fff"
                          : isOpBtn
                          ? colors.primary
                          : colors.foreground,
                        fontFamily: isSpc ? "Inter_500Medium" : "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {btn}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", padding: 16, gap: 16 },
  displayArea: {
    borderRadius: 20,
    padding: 24,
    alignItems: "flex-end",
    minHeight: 120,
    justifyContent: "flex-end",
  },
  opIndicator: { fontSize: 18, fontFamily: "Inter_400Regular", marginBottom: 4 },
  displayText: { fontSize: 56, fontFamily: "Inter_700Bold", fontWeight: "700" },
  buttons: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  zeroBtn: { flex: 2 },
  btnText: { fontSize: 22, fontWeight: "600" },
});
