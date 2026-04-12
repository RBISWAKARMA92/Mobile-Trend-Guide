import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

type Note = { id: string; text: string; createdAt: string };

export default function NotesScreen() {
  const colors = useColors();
  const { subscription } = useAuth();
  const isPro = subscription?.plan === "pro";

  useEffect(() => { trackToolOpen(isPro); }, []);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("notes").then((raw) => {
      if (raw) setNotes(JSON.parse(raw));
    });
  }, []);

  async function save(updated: Note[]) {
    setNotes(updated);
    await AsyncStorage.setItem("notes", JSON.stringify(updated));
  }

  function addNote() {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const note: Note = {
      id: Date.now().toString(),
      text: input.trim(),
      createdAt: new Date().toLocaleDateString(),
    };
    save([note, ...notes]);
    setInput("");
  }

  function deleteNote(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    save(notes.filter((n) => n.id !== id));
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.inputArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={input}
          onChangeText={setInput}
          placeholder={t.noteHint}
          placeholderTextColor={colors.mutedForeground}
          multiline
          onSubmitEditing={addNote}
          returnKeyType="done"
        />
        <Pressable
          onPress={addNote}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 && (
          <View style={styles.empty}>
            <Feather name="file-text" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.noNotes}</Text>
          </View>
        )}
        {notes.map((note) => (
          <View key={note.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardBody}>
              <Text style={[styles.noteText, { color: colors.foreground }]}>{note.text}</Text>
              <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>{note.createdAt}</Text>
            </View>
            <Pressable onPress={() => deleteNote(note.id)} style={styles.del}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inputArea: {
    margin: 16, flexDirection: "row", alignItems: "flex-end", gap: 10,
    borderRadius: 20, borderWidth: 1, padding: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 120, minHeight: 42 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, gap: 10 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  cardBody: { flex: 1, gap: 4 },
  noteText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  noteDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  del: { padding: 4 },
});
