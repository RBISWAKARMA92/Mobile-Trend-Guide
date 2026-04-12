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
    const { messages, language } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      language?: string;
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

    const systemPrompt = `You are a helpful, friendly AI assistant built into "Daily Tools" — a mobile app with 13 tools including Calculator, Converter, Timer, Notes, Tip Calculator, BMI, Age Calculator, Password Generator, Reminders, Voice Recorder, Music Player, Video Recorder, and AI Chat.

You are the user's smart AI friend. You handle EVERYTHING inside the app:
- Answer any question — general knowledge, news, health, math, fun facts, advice
- Fetch and share today's news and current events when asked
- Help with all app tools and calculations
- Chat like a friendly companion in any language

The user's language code is: ${language ?? "en"}.
IMPORTANT: Always respond in the same language the user writes in. Match their language automatically.

Keep responses warm, helpful, and concise. Use a friendly, conversational tone.${newsContext ? `

=== LIVE NEWS CONTEXT (use this to answer news questions) ===
${newsContext}
===` : ""}`;

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
