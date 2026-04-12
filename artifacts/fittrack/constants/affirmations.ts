// Daily affirmations — rotate based on day of year
// Designed to be uplifting, gentle, and inclusive for all ages including those with depression

export const affirmations = [
  { text: "You are stronger than you think. Every step counts. 💪", color: "#6366f1" },
  { text: "This moment is a gift. You are exactly where you need to be. 🌿", color: "#22c55e" },
  { text: "Small progress is still progress. You're doing great. 🌱", color: "#0ea5e9" },
  { text: "You deserve kindness — especially from yourself. 🤍", color: "#ec4899" },
  { text: "Every new day brings new possibilities. Welcome it. 🌅", color: "#f59e0b" },
  { text: "Your feelings are valid. You are not alone. 💙", color: "#6366f1" },
  { text: "Breathe in courage. Breathe out fear. You've got this. 🌬️", color: "#14b8a6" },
  { text: "One task at a time. One breath at a time. You're amazing. ⭐", color: "#8b5cf6" },
  { text: "The sun rose today — and so did you. That's enough. ☀️", color: "#f97316" },
  { text: "Be patient with yourself. Growth takes time. 🌸", color: "#ec4899" },
  { text: "You have survived 100% of your hardest days. You can do this. 🦋", color: "#6366f1" },
  { text: "Asking for help is a sign of strength, not weakness. 🤝", color: "#0ea5e9" },
  { text: "Your presence matters more than your productivity today. 🌟", color: "#22c55e" },
  { text: "Rest is not failure — it is wisdom. Take care of yourself. 🌙", color: "#6d28d9" },
  { text: "You are worthy of love exactly as you are. ❤️", color: "#ef4444" },
  { text: "Today is a new chapter. Write it gently. 📖", color: "#f59e0b" },
  { text: "Joy lives in small moments. Look for them today. 🌈", color: "#0ea5e9" },
  { text: "You are not behind. You are exactly on your own timeline. ⏳", color: "#8b5cf6" },
  { text: "Healing is not linear. Every day you try is a win. 🏆", color: "#22c55e" },
  { text: "You are braver than you believe. Take that step. 🦁", color: "#f97316" },
  { text: "The best investment you can make is in your own peace of mind. 🧘", color: "#14b8a6" },
  { text: "Your story isn't over. The best parts are still coming. 📚", color: "#ec4899" },
  { text: "Focus on progress, not perfection. You're enough. 💫", color: "#6366f1" },
  { text: "A little kindness changes everything. Start with yourself. 🌺", color: "#ec4899" },
  { text: "You don't need to have it all figured out. Just take the next step. 👣", color: "#0ea5e9" },
  { text: "Your calm is your superpower. Take a deep breath. 🌊", color: "#14b8a6" },
  { text: "Someone out there is thankful you exist. You matter. 💛", color: "#f59e0b" },
  { text: "Even on hard days, you are still growing. Trust the process. 🌻", color: "#22c55e" },
  { text: "Choose joy today — even just a little bit. 😊", color: "#8b5cf6" },
  { text: "You are resilient, capable, and deeply loved. Always. 🌟", color: "#6366f1" },
];

export function getTodayAffirmation() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return affirmations[dayOfYear % affirmations.length];
}

export const moodAffirmations: Record<number, string> = {
  1: "Wonderful! Spread that joy — your energy lifts everyone! 🌟",
  2: "Great to hear! Keep riding that positive wave. 😊",
  3: "You're doing okay, and that's perfectly fine. 🌿",
  4: "It's okay to not be okay. Be gentle with yourself today. 🤍",
  5: "Tough day? You are not alone. You've made it through before and you will again. 💙",
};
