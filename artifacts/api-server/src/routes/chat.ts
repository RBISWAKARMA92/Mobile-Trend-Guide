import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import Parser from "rss-parser";

const chatRouter = Router();
const rssParser = new Parser({ timeout: 6000 });

// ─── News keywords (English + Hindi + common Indian languages) ───────────────
const NEWS_KEYWORDS = [
  "news", "latest news", "today news", "headline", "breaking",
  "current events", "what happened", "aaj ki khabar", "khabar", "samachar",
  "aaj", "latest", "today", "morning news", "evening news",
  "cricket news", "india news", "world news", "sports news", "business news",
  "technology news", "political news", "bollywood news", "market news",
];

const YOUTUBE_KEYWORDS = [
  "play on youtube", "youtube par", "youtube mein", "youtube pe",
  "search youtube", "find on youtube", "youtube search",
  "open youtube", "watch on youtube",
];

function isNewsQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return NEWS_KEYWORDS.some((kw) => lower.includes(kw));
}

function isYoutubeQuery(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of YOUTUBE_KEYWORDS) {
    if (lower.includes(kw)) {
      const query = lower.replace(kw, "").replace(/play|watch|search|open|find/g, "").trim();
      return query || "latest videos";
    }
  }
  return null;
}

// ─── Fetch live news from RSS ─────────────────────────────────────────────────
async function fetchNews(query?: string): Promise<string> {
  const feeds = [
    { url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", name: "Times of India" },
    { url: "https://www.ndtv.com/rss/latest", name: "NDTV" },
    { url: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", name: "Google News India" },
  ];

  // If a topic is mentioned, use Google News topic search
  if (query && query.length > 2) {
    feeds.unshift({
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`,
      name: "Google News Search",
    });
  }

  for (const feed of feeds) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      const items = parsed.items.slice(0, 8);
      if (items.length === 0) continue;
      const headlines = items
        .map((item, i) => `${i + 1}. ${item.title}${item.pubDate ? ` (${new Date(item.pubDate).toLocaleDateString("en-IN")})` : ""}`)
        .join("\n");
      return `Latest news from ${feed.name}:\n${headlines}`;
    } catch {
      continue;
    }
  }

  return "";
}

// ─── Detect news topic from user message ──────────────────────────────────────
function extractNewsTopic(text: string): string | undefined {
  const lower = text.toLowerCase();
  const topicKeywords = ["about", "on", "related to", "regarding", "ke baare mein", "par", "ke liye"];
  for (const kw of topicKeywords) {
    const idx = lower.indexOf(kw + " ");
    if (idx !== -1) {
      const topic = text.slice(idx + kw.length + 1).replace(/news|khabar|samachar/gi, "").trim();
      if (topic.length > 2) return topic;
    }
  }
  // Extract meaningful nouns: cricket, india, politics, etc.
  const specificTopics = [
    "cricket", "ipl", "football", "sports", "india", "pakistan",
    "politics", "election", "budget", "economy", "market", "stock",
    "tech", "technology", "ai", "bollywood", "movies", "weather",
    "covid", "health", "business", "startup", "modi", "government",
  ];
  for (const topic of specificTopics) {
    if (lower.includes(topic)) return topic;
  }
  return undefined;
}

// ─── Chat Route ───────────────────────────────────────────────────────────────
chatRouter.post("/chat", async (req, res) => {
  try {
    const { messages, language, activityContext } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      language?: string;
      activityContext?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content ?? "";

    // ── YouTube in-app query ──────────────────────────────────────────────────
    const youtubeQuery = isYoutubeQuery(lastUserMessage);
    if (youtubeQuery) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.write(`data: ${JSON.stringify({ youtubeQuery, done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // ── News context injection ────────────────────────────────────────────────
    let newsContext = "";
    if (isNewsQuery(lastUserMessage)) {
      const topic = extractNewsTopic(lastUserMessage);
      newsContext = await fetchNews(topic);
    }

    const systemPrompt = `You are ZenSpace AI — a warm, caring, and supportive AI companion built into the ZenSpace mobile app. ZenSpace has 23+ daily tools: 🙏 Chant Counter (mala/rosary meditation), 🤖 AI Friend (you!), 🧮 Calculator, ↔️ Converter, ⏰ Timer, 📝 Notes, 💰 Expense Tracker, 👤 BMI, 🎂 Age, 💡 Tip, 🔒 Password, 🔔 Reminders, 🎙️ Voice Recorder, 🎵 Music, 📹 Video, 🧒 Kids Zone, 🔦 Flashlight, 🌍 World Clock, 📱 QR Code.

You are the user's kind AI companion who handles EVERYTHING:
- Answer any question — general knowledge, news, health, math, fun facts, advice, recipes
- Navigate app tools when asked (say which tool to use)
- Chat warmly in any language — match the user's language automatically

WELLNESS & MENTAL HEALTH GUIDELINES (critical):
- Use gentle, positive, encouraging language ALWAYS — suitable for all ages including children and elderly
- NEVER use harsh, dismissive, or critical language
- When user expresses sadness, loneliness, or feeling low:
  • Acknowledge warmly: "I hear you, and I'm really glad you're sharing this with me"
  • Suggest gentle coping: deep breathing, using the Chant Counter for meditation, writing in Notes, listening to music
  • Remind them: "You are not alone. This feeling will pass. Be kind to yourself."
  • Suggest gentle professional support if appropriate: "Talking to a trusted person or counselor can really help"
- When detecting crisis language (self-harm, suicide, hopelessness, wanting to disappear):
  • Respond with deep compassion: "I'm really concerned about you, and I'm here for you right now"
  • Share helplines gently: iCall India: 9152987821 (Mon–Sat 8am–10pm) | Vandrevala Foundation: 1860-2662-3455 (24/7) | International: findahelpline.com
  • Never minimize or dismiss their feelings
- When user seems stressed: suggest breathing — "Try: breathe in 4 counts, hold 4, out 6. Repeat 3 times. 🌬️"
- Celebrate small wins and efforts with genuine warmth

The user's language: ${language ?? "en"} — ALWAYS reply in the same language they write in.
${activityContext ? `\nUser's activity today: ${activityContext}` : ""}${newsContext ? `\n\n=== LIVE NEWS ===\n${newsContext}\n===` : ""}`;

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed. Please try again." });
    }
  }
});

export default chatRouter;
