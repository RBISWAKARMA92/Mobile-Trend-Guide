import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Reminder = {
  id: string;
  title: string;
  dateISO: string;
  notifId: string | null;
  enabled: boolean;
};

const STORAGE_KEY = "daily_tools_reminders";

async function requestPermission() {
  if (Platform.OS === "web") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function scheduleNotif(title: string, dateISO: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const granted = await requestPermission();
  if (!granted) return null;
  const date = new Date(dateISO);
  if (date <= new Date()) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: "⏰ " + title, body: "Daily Tools Reminder", sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
  return id;
}

async function cancelNotif(id: string | null) {
  if (!id || Platform.OS === "web") return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function toLocalInputValue(dateISO: string) {
  const d = new Date(dateISO);
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

function fromLocalInputValue(val: string) {
  return new Date(val).toISOString();
}

function defaultDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30, 0, 0);
  return toLocalInputValue(d.toISOString());
}

function formatDisplay(dateISO: string) {
  return new Date(dateISO).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [dateVal, setDateVal] = useState(defaultDateTime());
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setReminders(JSON.parse(raw));
  }, []);

  const save = useCallback(async (list: Reminder[]) => {
    setReminders(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  useEffect(() => {
    if (!loaded.current) { loaded.current = true; load(); }
  }, [load]);

  async function addReminder() {
    if (!title.trim()) return;
    setSaving(true);
    const dateISO = fromLocalInputValue(dateVal);
    const notifId = await scheduleNotif(title.trim(), dateISO);
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: title.trim(),
      dateISO,
      notifId,
      enabled: true,
    };
    await save([reminder, ...reminders]);
    setSaving(false);
    setTitle("");
    setDateVal(defaultDateTime());
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function deleteReminder(r: Reminder) {
    await cancelNotif(r.notifId);
    await save(reminders.filter((x) => x.id !== r.id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function toggleReminder(r: Reminder) {
    let updated: Reminder;
    if (!r.enabled) {
      const notifId = await scheduleNotif(r.title, r.dateISO);
      updated = { ...r, enabled: true, notifId };
    } else {
      await cancelNotif(r.notifId);
      updated = { ...r, enabled: false, notifId: null };
    }
    await save(reminders.map((x) => x.id === r.id ? updated : x));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const isPast = (dateISO: string) => new Date(dateISO) < new Date();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t.reminders ?? "Reminders"}
        </Text>
        <Pressable
          onPress={() => setShowModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {reminders.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="alarm-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t.noReminders ?? "No reminders yet. Tap + to add one."}
            </Text>
          </View>
        )}
        {reminders.map((r) => (
          <View
            key={r.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: r.enabled && !isPast(r.dateISO) ? colors.primary + "40" : colors.border,
                opacity: isPast(r.dateISO) ? 0.55 : 1,
              },
            ]}
          >
            <View style={[styles.dotWrap]}>
              <View style={[styles.dot, { backgroundColor: r.enabled && !isPast(r.dateISO) ? colors.primary : colors.mutedForeground }]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
                {formatDisplay(r.dateISO)}
                {isPast(r.dateISO) ? "  ✓" : ""}
              </Text>
            </View>
            <Switch
              value={r.enabled && !isPast(r.dateISO)}
              onValueChange={() => !isPast(r.dateISO) && toggleReminder(r)}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={r.enabled ? colors.primary : colors.mutedForeground}
              disabled={isPast(r.dateISO)}
            />
            <Pressable onPress={() => deleteReminder(r)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t.addReminder ?? "Add Reminder"}
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {t.reminderTitle ?? "Title"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder={t.reminderTitle ?? "Title"}
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {t.reminderTime ?? "Date & Time"}
            </Text>
            {Platform.OS === "web" ? (
              <input
                type="datetime-local"
                value={dateVal}
                min={toLocalInputValue(new Date().toISOString())}
                onChange={(e) => setDateVal(e.target.value)}
                style={{
                  width: "100%", padding: 12, borderRadius: 10, marginBottom: 16,
                  fontSize: 15, border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background, color: colors.foreground,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.mutedForeground}
                value={dateVal.replace("T", " ")}
                onChangeText={(v) => setDateVal(v.replace(" ", "T"))}
              />
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => { setShowModal(false); setTitle(""); setDateVal(defaultDateTime()); }}
              >
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: saving || !title.trim() ? 0.6 : 1 }]}
                onPress={addReminder}
                disabled={saving || !title.trim()}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                  {t.setReminder ?? "Set Reminder"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260 },
  card: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 12,
  },
  dotWrap: { width: 10, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardTime: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  deleteBtn: { padding: 6 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
});
