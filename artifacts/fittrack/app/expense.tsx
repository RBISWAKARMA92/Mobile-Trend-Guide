import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
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

type Category = { id: string; label: string; emoji: string; color: string };
type Expense = { id: string; amount: number; note: string; category: string; date: string };

const CATEGORIES: Category[] = [
  { id: "food", label: "Food", emoji: "🍔", color: "#f59e0b" },
  { id: "transport", label: "Transport", emoji: "🚌", color: "#3b82f6" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "#ec4899" },
  { id: "health", label: "Health", emoji: "💊", color: "#22c55e" },
  { id: "entertainment", label: "Fun", emoji: "🎬", color: "#8b5cf6" },
  { id: "bills", label: "Bills", emoji: "📄", color: "#ef4444" },
  { id: "education", label: "Education", emoji: "📚", color: "#0ea5e9" },
  { id: "other", label: "Other", emoji: "💰", color: "#64748b" },
];

const STORAGE_KEY = "daily_expenses";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isThisMonth(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export default function ExpenseScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedCat, setSelectedCat] = useState("food");
  const [filter, setFilter] = useState<"today" | "month" | "all">("today");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setExpenses(JSON.parse(raw));
    });
  }, []);

  async function saveAll(list: Expense[]) {
    setExpenses(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addExpense() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const exp: Expense = {
      id: Date.now().toString(),
      amount: amt,
      note: note.trim(),
      category: selectedCat,
      date: new Date().toISOString(),
    };
    saveAll([exp, ...expenses]);
    setAmount("");
    setNote("");
    setSelectedCat("food");
    setShowModal(false);
  }

  function deleteExpense(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveAll(expenses.filter((e) => e.id !== id));
  }

  const filtered = expenses.filter((e) =>
    filter === "today" ? isToday(e.date) : filter === "month" ? isThisMonth(e.date) : true
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCat = CATEGORIES.map((c) => ({
    ...c,
    sum: filtered.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.sum > 0).sort((a, b) => b.sum - a.sum);

  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Expenses</Text>
        <Pressable onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>
            {filter === "today" ? "Today's Spending" : filter === "month" ? "This Month" : "All Time"}
          </Text>
          <Text style={styles.summaryAmount}>₹{fmt(total)}</Text>
          <Text style={styles.summaryCount}>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(["today", "month", "all"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary : colors.card, borderColor: filter === f ? colors.primary : colors.border }]}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
                {f === "today" ? "Today" : f === "month" ? "Month" : "All"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category breakdown */}
        {byCat.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Category</Text>
            {byCat.map((c) => (
              <View key={c.id} style={styles.catBreakdown}>
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <View style={styles.catBarWrap}>
                  <View style={styles.catBarLabel}>
                    <Text style={[styles.catLabel, { color: colors.foreground }]}>{c.label}</Text>
                    <Text style={[styles.catAmt, { color: colors.primary }]}>₹{fmt(c.sum)}</Text>
                  </View>
                  <View style={[styles.catBarTrack, { backgroundColor: colors.muted }]}>
                    <View style={[styles.catBarFill, { backgroundColor: c.color, width: `${Math.round((c.sum / total) * 100)}%` as any }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transaction list */}
        <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>Transactions</Text>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>💰</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No expenses yet. Tap + to add one.
            </Text>
          </View>
        ) : (
          filtered.map((exp) => {
            const cat = catMap[exp.category] ?? catMap["other"];
            return (
              <View key={exp.id} style={[styles.expCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.expIcon, { backgroundColor: cat.color + "20" }]}>
                  <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                </View>
                <View style={styles.expInfo}>
                  <Text style={[styles.expNote, { color: colors.foreground }]} numberOfLines={1}>
                    {exp.note || cat.label}
                  </Text>
                  <Text style={[styles.expDate, { color: colors.mutedForeground }]}>
                    {fmtDate(exp.date)} • {cat.label}
                  </Text>
                </View>
                <Text style={[styles.expAmt, { color: colors.foreground }]}>₹{fmt(exp.amount)}</Text>
                <Pressable onPress={() => deleteExpense(exp.id)} style={styles.delBtn}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Expense</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Amount (₹)</Text>
            <TextInput
              style={[styles.amtInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Note (optional)</Text>
            <TextInput
              style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCat(c.id)}
                  style={[
                    styles.catChip,
                    { backgroundColor: selectedCat === c.id ? c.color : colors.muted, borderColor: selectedCat === c.id ? c.color : "transparent" },
                  ]}
                >
                  <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catChipLabel, { color: selectedCat === c.id ? "#fff" : colors.foreground }]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowModal(false)} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={addExpense}
                style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: !amount || parseFloat(amount) <= 0 ? 0.5 : 1 }]}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 14 },
  summaryCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 },
  summaryAmount: { fontSize: 44, fontFamily: "Inter_700Bold", color: "#fff" },
  summaryCount: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: "center", borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  catBreakdown: { flexDirection: "row", alignItems: "center", gap: 12 },
  catEmoji: { fontSize: 22, width: 30 },
  catBarWrap: { flex: 1, gap: 4 },
  catBarLabel: { flexDirection: "row", justifyContent: "space-between" },
  catLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catAmt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  catBarTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: 6, borderRadius: 3 },
  listTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  expCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 12, gap: 12 },
  expIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  expInfo: { flex: 1 },
  expNote: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  expDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  expAmt: { fontSize: 16, fontFamily: "Inter_700Bold" },
  delBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 36, gap: 10 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  amtInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 28, fontFamily: "Inter_700Bold" },
  noteInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  catChipEmoji: { fontSize: 16 },
  catChipLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  modalBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
