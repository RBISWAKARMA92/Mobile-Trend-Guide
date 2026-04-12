import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const chatRouter = Router();

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

    const systemPrompt = `You are a helpful, friendly AI assistant built into "Daily Tools" — a mobile app with tools like Calculator, Converter, Timer, Notes, Tip Calculator, BMI, Age Calculator, Password Generator, and Reminders.

You are like a smart friend who speaks the user's language. Be warm, concise, and practical. Help users with:
- Calculations, unit conversions, and math questions
- Health and fitness questions (BMI, nutrition, exercise)
- General knowledge, fun facts, and curiosity
- Tips on how to use the Daily Tools app
- Any everyday question a friend would help with

The user's language code is: ${language ?? "en"}. 
IMPORTANT: Always respond in the same language the user writes in. If they write in Hindi, respond in Hindi. If they write in Tamil, respond in Tamil. Match their language automatically.

Keep responses friendly, helpful, and not too long. Use a conversational tone like texting a knowledgeable friend.`;

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
